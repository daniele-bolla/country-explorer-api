import { adapterApiToCountryInput } from '../adapters/adapterAPI';
import { db } from '../db';
import { fetchCountriesFromApi } from './CountriesApi';
import { findOrCreateRegion } from './RegionsService';
import { bulkCreateSubregions } from './SubRegionsService';
import { bulkCreateLanguages } from './LanguagesService';
import { bulkCreateCurrencies } from './CurrenciesService';
import { bulkCreateCountriesEntity } from './CountriesService';
import {
  bulkCreateCurrencyRelations,
  bulkCreateLanguageRelations,
} from './CountriesRelationsService';
import { CountryApiResponse } from '../types/countryModel';
import { devLog } from '../utils/devLog';
import { count } from 'drizzle-orm';
import { countriesTable } from '../db/schema';

export async function bulkCreateCountries(countries: CountryApiResponse[]) {
  const stats = {
    startTime: Date.now(),
    counts: {
      countries: 0,
      regions: 0,
      subregions: 0,
      languages: 0,
      currencies: 0,
      relations: 0,
    },
  };

  const adaptedCountries = countries.map(adapterApiToCountryInput);

  const languagesInputsMap = new Map(
    adaptedCountries.flatMap(({ languages }) =>
      languages.map(({ code, name }) => [code, { code, name }]),
    ),
  );

  const currenciesInputsMap = new Map(
    adaptedCountries.flatMap(({ currencies }) =>
      currencies.map(({ code, name }) => [code, { code, name }]),
    ),
  );

  const regionsMap = adaptedCountries.reduce((map, { region, subregion }) => {
    if (!map.has(region)) {
      map.set(region, new Set());
    }
    if (subregion) {
      map.get(region)!.add(subregion);
    }
    return map;
  }, new Map<string, Set<string>>());

  const regionsArray = Array.from(regionsMap, ([region, subregionsSet]) => ({
    region,
    subregions: Array.from(subregionsSet),
  }));
  stats.counts.regions = regionsArray.length;
  stats.counts.subregions = regionsArray.reduce(
    (count, { subregions }) => count + subregions.length,
    0,
  );

  const regionIds = new Map<string, number>();
  try {
    await db.transaction(async (tx) => {
      // Process regions and subregions
      devLog('⏳ Processing regions and subregions...');
      const regionPromises = regionsArray.map(
        async ({ region, subregions }) => {
          const { id: regionId } = await findOrCreateRegion(tx, region);
          regionIds.set(region, regionId);

          const subregionsWithId = subregions.map((name) => ({
            regionId,
            name,
          }));

          const insertedSubregion = await bulkCreateSubregions(
            tx,
            subregionsWithId,
          );

          return insertedSubregion.map(({ name, id }) => ({ name, id }));
        },
      );

      const allInsertedSubregion = await Promise.all(regionPromises);
      stats.counts.regions = allInsertedSubregion.length;

      const subregionIds = new Map(
        allInsertedSubregion.flat().map(({ name, id }) => [name, id]),
      );
      stats.counts.regions = subregionIds.size;

      // Insert languages
      devLog('⏳ Inserting languages...');
      const languagesInputs = Array.from(languagesInputsMap.values());
      const insertedLanguages = await bulkCreateLanguages(tx, languagesInputs);
      const languagesIds = new Map(
        insertedLanguages.map(({ code, id }) => [code, id]),
      );

      stats.counts.languages = languagesIds.size;
      // Insert currencies
      devLog('⏳ Inserting currencies...');
      const currenciesInputs = Array.from(currenciesInputsMap.values());
      const insertedcurrencies = await bulkCreateCurrencies(
        tx,
        currenciesInputs,
      );
      const currenciesIds = new Map(
        insertedcurrencies.map(({ code, id }) => [code, id]),
      );
      stats.counts.currencies = currenciesIds.size;

      // Insert countries
      devLog('⏳ Inserting countries...');
      const countriesInputs = adaptedCountries.map(
        ({ region, subregion, ...rest }) => ({
          ...rest,
          region,
          subregion,
          regionId: regionIds.get(region),
          subregionId: subregionIds.get(subregion),
        }),
      );

      const insertedCountries = await bulkCreateCountriesEntity(
        tx,
        countriesInputs,
      );
      const countriesIds = new Map(
        insertedCountries.map(({ cca3, id }) => [cca3, id]),
      );
      stats.counts.currencies = countriesIds.size;

      // Create relationships
      devLog('⏳ Creating relationships...');
      const countryLanguagesInputs = countriesInputs.flatMap((country) =>
        country.languages.map((language) => ({
          countryId: countriesIds.get(country.cca3)!,
          languageId: languagesIds.get(language.code)!,
        })),
      );

      const countryCurrenciesInputs = countriesInputs.flatMap((country) =>
        country.currencies.map((currency) => ({
          countryId: countriesIds.get(country.cca3)!,
          currencyId: currenciesIds.get(currency.code)!,
        })),
      );

      await bulkCreateLanguageRelations(tx, countryLanguagesInputs);
      await bulkCreateCurrencyRelations(tx, countryCurrenciesInputs);

      stats.counts.relations =
        countryLanguagesInputs.length + countryCurrenciesInputs.length;
    });

    // Print simple summary
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    devLog('✅ Import completed successfully!');
    devLog(
      `⏱️ Time: ${duration}s | 🌎 Countries: ${stats.counts.countries} | 🔤 Languages: ${stats.counts.languages} | 💰 Currencies: ${stats.counts.currencies} | 🔗 Relations: ${stats.counts.relations}`,
    );

    return { success: true, stats };
  } catch (error) {
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    console.error(`❌ Import failed after ${duration}s:`, error);
    return { success: false, error };
  }
}

export async function importCountriesFromApi() {
  devLog('🚀 Starting country import from API...');

  const countries = await fetchCountriesFromApi();
  devLog(`📥 Fetched ${countries.length} countries from API`);
  await bulkCreateCountries(countries);
}

export async function importCountriesIfEmptyDB() {
  const [result] = await db.select({ count: count() }).from(countriesTable);

  if (result.count === 0) {
    devLog('Database is empty. Loading initial country data...');
    await importCountriesFromApi();
  } else {
    devLog(`Database already contains ${result.count} countries.`);
  }
}
