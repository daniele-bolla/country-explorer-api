// src/services/countryImporter.ts
import { db } from '../db';
import {
  countriesTable,
  languagesTable,
  currenciesTable,
  countriesLanguagesTable,
  countriesCurrenciesTable,
} from '../db/schema';
import { sql } from 'drizzle-orm';
import { fetchCountriesFromApi } from './CountriesApi';
import { countriesData } from '../mock';

// Optimal batch size based on PostgreSQL performance characteristics
const BATCH_SIZE = 50;

export async function importCountries() {
  console.log('Starting optimized country import process...');
  const startTime = performance.now();

  const stats = {
    countries: { inserted: 0, updated: 0 },
    languages: { inserted: 0 },
    currencies: { inserted: 0 },
    relationshipsCreated: 0,
    batches: 0,
    duration: '',
  };

  try {
    // 1. Fetch countries from API
    const response = await fetchCountriesFromApi();
    const countries = response.data;
    // const countries = countriesData;
    // console.log(`Fetched ${countries.length} countries from API`);
    console.log(countries);
    // 2. Process in batchesi
    if (!countries.length) {
      for (let i = 0; i < countries.length; i += BATCH_SIZE) {
        const batch = countries.slice(i, i + BATCH_SIZE);
        console.log(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(countries.length / BATCH_SIZE)}`,
        );

        // Process each batch inside a transaction
        await db.transaction(async (tx) => {
          // === CLEVER OPTIMIZATION: Use PostgreSQL's ON CONFLICT for upsert ===

          // Prepare country values for upsert
          const countryValues = batch.map((country) => ({
            name: country.name,
            code: country.code,
            region: country.region || null,
            subregion: country.subregion || null,
            population: country.population || null,
            flag: country.flagPng.svg || country.flagPng.png || null,
          }));

          // Upsert countries in a single query
          const upsertedCountries = await tx
            .insert(countriesTable)
            .values(countryValues)
            .onConflictDoUpdate({
              target: countriesTable.code,
              set: {
                name: sql`excluded.name`,
                region: sql`excluded.region`,
                subregion: sql`excluded.subregion`,
                population: sql`excluded.population`,
                flag: sql`excluded.flag`,
              },
            })
            .returning({
              id: countriesTable.id,
              code: countriesTable.code,
              // Track if row was inserted or updated
              wasInserted: sql`xmax = 0`,
            });

          // Track stats
          const inserted = upsertedCountries.filter(
            (c) => c.wasInserted,
          ).length;
          const updated = upsertedCountries.length - inserted;
          stats.countries.inserted += inserted;
          stats.countries.updated += updated;

          // Create a map of country codes to IDs
          const countryMap = new Map(
            upsertedCountries.map((c) => [c.code, c.id]),
          );

          // === EFFICIENT LANGUAGE HANDLING ===

          // Extract unique languages in this batch
          const batchLanguages = new Map();
          batch.forEach((country) => {
            if (country.languages) {
              Object.entries(country.languages).forEach(([code, name]) => {
                batchLanguages.set(code, name);
              });
            }
          });

          // Upsert languages
          const languageUpserts = await tx
            .insert(languagesTable)
            .values(
              [...batchLanguages].map(([code, name]) => ({
                code,
                name: typeof name === 'string' ? name : 'Unknown',
              })),
            )
            .onConflictDoNothing()
            .returning({
              id: languagesTable.id,
              code: languagesTable.code,
            });

          stats.languages.inserted += languageUpserts.length;

          // Get existing languages that were not inserted
          const existingLanguageCodes = new Set(
            languageUpserts.map((l) => l.code),
          );
          const missingLanguageCodes = [...batchLanguages.keys()].filter(
            (code) => !existingLanguageCodes.has(code),
          );

          let allLanguages = [...languageUpserts];

          if (missingLanguageCodes.length > 0) {
            const existingLanguages = await tx
              .select({
                id: languagesTable.id,
                code: languagesTable.code,
              })
              .from(languagesTable)
              .where(
                sql`${languagesTable.code} IN (${missingLanguageCodes.join(',')})`,
              );

            allLanguages = [...allLanguages, ...existingLanguages];
          }

          // Build language map
          const languageMap = new Map(allLanguages.map((l) => [l.code, l.id]));

          // === EFFICIENT CURRENCY HANDLING ===

          // Extract unique currencies in this batch
          const batchCurrencies = new Map();
          batch.forEach((country) => {
            if (country.currencies) {
              Object.entries(country.currencies).forEach(([code, details]) => {
                const name =
                  typeof details === 'object' ? details.name : 'Unknown';
                batchCurrencies.set(code, name);
              });
            }
          });

          // Upsert currencies
          const currencyUpserts = await tx
            .insert(currenciesTable)
            .values(
              [...batchCurrencies].map(([code, name]) => ({ code, name })),
            )
            .onConflictDoNothing()
            .returning({
              id: currenciesTable.id,
              code: currenciesTable.code,
            });

          stats.currencies.inserted += currencyUpserts.length;

          // Get existing currencies that were not inserted
          const existingCurrencyCodes = new Set(
            currencyUpserts.map((c) => c.code),
          );
          const missingCurrencyCodes = [...batchCurrencies.keys()].filter(
            (code) => !existingCurrencyCodes.has(code),
          );

          let allCurrencies = [...currencyUpserts];

          if (missingCurrencyCodes.length > 0) {
            const existingCurrencies = await tx
              .select({
                id: currenciesTable.id,
                code: currenciesTable.code,
              })
              .from(currenciesTable)
              .where(
                sql`${currenciesTable.code} IN (${missingCurrencyCodes.join(',')})`,
              );

            allCurrencies = [...allCurrencies, ...existingCurrencies];
          }

          // Build currency map
          const currencyMap = new Map(allCurrencies.map((c) => [c.code, c.id]));

          // === OPTIMIZED RELATIONSHIP HANDLING ===

          // Clear existing relationships for this batch of countries
          const countryIds = upsertedCountries.map((c) => c.id);

          await tx
            .delete(countriesLanguagesTable)
            .where(sql`country_id IN (${countryIds.join(',')})`);

          await tx
            .delete(countriesCurrenciesTable)
            .where(sql`country_id IN (${countryIds.join(',')})`);

          // Prepare new relationships
          const languageRelationships = [];
          const currencyRelationships = [];

          batch.forEach((country) => {
            const countryId = countryMap.get(country.code);
            if (!countryId) return;

            // Add language relationships
            if (country.languages) {
              Object.keys(country.languages).forEach((langCode) => {
                const languageId = languageMap.get(langCode);
                if (languageId) {
                  languageRelationships.push({
                    countryId,
                    languageId,
                  });
                }
              });
            }

            // Add currency relationships
            if (country.currencies) {
              Object.keys(country.currencies).forEach((currCode) => {
                const currencyId = currencyMap.get(currCode);
                if (currencyId) {
                  currencyRelationships.push({
                    countryId,
                    currencyId,
                  });
                }
              });
            }
          });

          // Insert all relationships
          if (languageRelationships.length > 0) {
            await tx
              .insert(countriesLanguagesTable)
              .values(languageRelationships);
          }

          if (currencyRelationships.length > 0) {
            await tx
              .insert(countriesCurrenciesTable)
              .values(currencyRelationships);
          }

          stats.relationshipsCreated +=
            languageRelationships.length + currencyRelationships.length;
        });

        stats.batches++;
      }
    }

    const endTime = performance.now();
    stats.duration = `${((endTime - startTime) / 1000).toFixed(2)} seconds`;

    console.log('Import completed successfully:');
    console.log(
      `- Countries: ${stats.countries.inserted} inserted, ${stats.countries.updated} updated`,
    );
    console.log(`- Languages: ${stats.languages.inserted} inserted`);
    console.log(`- Currencies: ${stats.currencies.inserted} inserted`);
    console.log(`- Relationships: ${stats.relationshipsCreated} created`);
    console.log(`- Batches: ${stats.batches}`);
    console.log(`- Duration: ${stats.duration}`);

    return stats;
  } catch (error) {
    console.error('Error during country import:', error);
    throw error;
  }
}
