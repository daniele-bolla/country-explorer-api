import { eq, sql, and } from 'drizzle-orm';
import { adapterApiToCountryInput } from '../adapters/adapterAPI';
import { db } from '../db';
import {
  countriesTable,
  countryCurrenciesTable,
  countryLanguagesTable,
  currenciesTable,
  languagesTable,
  regionsTable,
  subregionsTable,
} from '../db/schema';
import { fetchCountriesFromApi } from './CountriesApi';
import { clearDatabase } from '../testutils/clearDatabase';
import { findOrCreateRegion } from './RegionsService';
import { bulkCreateSubregion } from './SubRegionsService';
import { SubregionInput } from '../types/countryModel';

export async function importCountries() {
  const countries = await fetchCountriesFromApi();

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
  await clearDatabase();

  const regionIds = new Map<string, number>();
  const subregionIdsArray: { name: string; id: number }[] = [];

  await db.transaction(async (tx) => {
    const regionPromises = regionsArray.map(async ({ region, subregions }) => {
      const { id: regionId } = await findOrCreateRegion(tx, region);

      regionIds.set(region, regionId);

      const subregionsWithId = subregions.map((name) => ({
        regionId,
        name,
      }));

      const newSubregions = (
        await bulkCreateSubregion(tx, subregionsWithId)
      ).map(({ name, id }) => ({ name, id }));

      return newSubregions;
    });

    const allNewSubregions = await Promise.all(regionPromises);
    subregionIdsArray.push(...allNewSubregions.flat());

    const subregionIds = new Map(
      subregionIdsArray.map(({ name, id }) => [name, id]),
    );

    // Insert languages and store IDs
    const languagesInputs = Array.from(languagesInputsMap.values());

    const insertedLanguages = await tx
      .insert(languagesTable)
      .values(languagesInputs)
      .onConflictDoUpdate({
        target: languagesTable.code,
        set: {
          name: sql`excluded.name`,
        },
      })
      .returning();

    const languagesIds = new Map(
      insertedLanguages.map(({ code, id }) => [code, id]),
    );
    console.log(languagesIds);

    // Insert languages and store IDs
    const currenciesInputs = Array.from(currenciesInputsMap.values());

    const insertedcurrencies = await tx
      .insert(currenciesTable)
      .values(currenciesInputs)
      .onConflictDoUpdate({
        target: currenciesTable.code,
        set: {
          code: sql`excluded.name`,
        },
      })
      .returning();

    const currenciesIds = new Map(
      insertedcurrencies.map(({ code, id }) => [code, id]),
    );

    console.log(currenciesIds);
    // .map(
    //   async (language) => {
    //     const [newLanguage] = await tx
    //       .insert(languagesTable)
    //       .values(language)
    //       .onConflictDoUpdate({
    //         target: languagesTable.code,
    //         set: {
    //           name: sql`excluded.name`,
    //         },
    //       })
    //       .returning();

    //     return newLanguage;
    //   },
    // );

    // const insertedLanguages = await Promise.all(languagePromises);
    // insertedLanguages.forEach((lang) => {
    //   languageIds.set(lang.code, lang.id);
    // });

    // Prepare and insert countries

    const countriesInputs = adaptedCountries.map(
      ({ region, subregion, ...rest }) => ({
        ...rest,
        regionId: regionIds.get(region),
        subregionId: subregionIds.get(subregion),
      }),
    );

    const insertedCountries = await tx
      .insert(countriesTable)
      .values(countriesInputs)
      .onConflictDoUpdate({
        target: countriesTable.cca3,
        set: {
          name: sql`excluded.name`,
          capital: sql`excluded.capital`,
          regionId: sql`excluded.region_id`,
          subregionId: sql`excluded.subregion_id`,
          population: sql`excluded.population`,
          flagSvg: sql`excluded.flag_svg`,
          flagPng: sql`excluded.flag_png`,
        },
      })
      .returning();

    /**
     * Bulk Country Relations
     */
    const countriesIds = new Map(
      insertedCountries.map(({ cca3, id }) => [cca3, id]),
    );

    const countryLanguagesInputs = countriesInputs.flatMap((country) =>
      country.languages.map((language) => ({
        countryId: countriesIds.get(country.cca3)!,
        languageId: languagesIds.get(language.code)!,
      })),
    );

    const insertCountriesLanguages = await tx
      .insert(countryLanguagesTable)
      .values(countryLanguagesInputs)
      .onConflictDoNothing();

    const countryCurrenciesInputs = countriesInputs.flatMap((country) =>
      country.currencies.map((currency) => ({
        countryId: countriesIds.get(country.cca3)!,
        currencyId: currenciesIds.get(currency.code)!,
      })),
    );

    const insertCountriesCurrenies = await tx
      .insert(countryCurrenciesTable)
      .values(countryCurrenciesInputs)
      .onConflictDoNothing();
  });
}
