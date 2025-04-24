import { adapterApiToCountryInput } from '../adapters/adapterAPI';
import { db } from '../db';
import { fetchCountriesFromApi } from './CountriesApi';
import { clearDatabase } from '../testutils/clearDatabase';
import { findOrCreateRegion } from './RegionsService';
import { bulkCreateSubregions } from './SubRegionsService';
import { bulkCreateLanguages } from './LanguagesService';
import { bulkCreateCurrencies } from './CurrenciesService';
import { bulkCreateCountriesEntity } from './CountriesService';
import {
  bulkCreateCurrencyRelations,
  bulkCreateLanguageRelations,
} from './CountriesRelationsService';

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
  try {
    await db.transaction(async (tx) => {
      /**
       * Bulk create subregion for each region
       */
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

      const subregionIds = new Map(
        allInsertedSubregion.flat().map(({ name, id }) => [name, id]),
      );

      /**
       * Bulk insert languages
       */
      const languagesInputs = Array.from(languagesInputsMap.values());
      const insertedLanguages = await bulkCreateLanguages(tx, languagesInputs);
      const languagesIds = new Map(
        insertedLanguages.map(({ code, id }) => [code, id]),
      );

      /**
       * Bulk insert currencies
       */
      const currenciesInputs = Array.from(currenciesInputsMap.values());
      const insertedcurrencies = await bulkCreateCurrencies(
        tx,
        currenciesInputs,
      );
      const currenciesIds = new Map(
        insertedcurrencies.map(({ code, id }) => [code, id]),
      );

      /**
       * Bulk insert countries
       */
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

      /**
       * Bulk country-relations
       */
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
    });
  } catch (error) {
    console.error(error);
  }
}
