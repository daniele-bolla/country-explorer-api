import axios from 'axios';
import { eq, like, and, gt, lt, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import config from '../config.js';

import {
  countriesTable,
  Country,
  countryCurrencies,
  countryLanguages,
  countryRelations,
  currenciesTable,
  languagesTable,
} from '../db/schema.js';
import {
  CountryApiInput,
  CountryEntity,
  CurrencyEntity,
  LanguageEntity,
} from '../types/countryModel.js';
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export const getCountries = async ({
  pageSize = 25,
  page = 1,
}: PaginationOptions = {}): Promise<PaginatedResult<Country>> => {
  const countries = await db
    .select()
    .from(countriesTable)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Get total count (for pagination metadata)
  const [{ count }] = await db
    .select({
      count: sql`count(*)`.mapWith(Number),
    })
    .from(countriesTable);

  return {
    data: countries,
    meta: {
      total: count,
      page,
      pageSize,
    },
  };
};

async function addLanguage(lang: LanguageEntity) {
  return await db.transaction(async (tx) => {
    const existingLanguage = await tx
      .select()
      .from(languagesTable)
      .where(eq(languagesTable.code, lang.code))
      .limit(1);

    if (existingLanguage.length === 0) {
      const [newLanguage] = await tx
        .insert(languagesTable)
        .values({
          code: lang.code,
          name: lang.name,
        })
        .returning();

      return newLanguage;
    } else {
      return existingLanguage[0];
    }
  });
}

async function addCurrency(curr: CurrencyEntity) {
  return await db.transaction(async (tx) => {
    const existingCurrency = await tx
      .select()
      .from(currenciesTable)
      .where(eq(currenciesTable.code, curr.code))
      .limit(1);

    if (existingCurrency.length === 0) {
      const [newCurrency] = await tx
        .insert(currenciesTable)
        .values({
          code: curr.code,
          name: curr.name,
        })
        .returning();

      return newCurrency;
    } else {
      return existingCurrency[0];
    }
  });
}

export async function addCountry(input: CountryApiInput) {
  return await db.transaction(async (tx) => {
    const existingCountry = await tx
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.cca3, input.cca3))
      .limit(1);
    if (existingCountry.length > 0) return existingCountry;

    const [country] = await tx
      .insert(countriesTable)
      .values({
        name: input.name,
        cca3: input.cca3,
        capital: input.capital,
        region: input.region,
        population: input.population,
        flagPng: input.flagPng,
        flagSvg: input.flagSvg,
      })
      .returning();

    for (const lang of input.languages) {
      await addLanguage(lang);
    }

    for (const curr of input.currencies) {
      await addCurrency(curr);
    }

    return country;
  });
}

async function getCountryLanguages(country: Pick<CountryEntity, 'id'>) {
  const languages = await db
    .select({
      id: languagesTable.id,
      code: languagesTable.code,
      name: languagesTable.name,
    })
    .from(languagesTable)
    .innerJoin(
      countryLanguages,
      eq(languagesTable.id, countryLanguages.languageId),
    )
    .where(eq(countryLanguages.countryId, country.id));
  return languages;
}

async function getCountryCurrencies(country: Pick<CountryEntity, 'id'>) {
  const currencies = await db
    .select({
      id: currenciesTable.id,
      code: currenciesTable.code,
      name: currenciesTable.name,
    })
    .from(currenciesTable)
    .innerJoin(
      countryCurrencies,
      eq(currenciesTable.id, countryCurrencies.currencyId),
    )
    .where(eq(countryCurrencies.countryId, country.id));
  return currencies;
}

type CountrySearchField = 'id' | 'name' | 'cca3' | 'region';
function getSearchQueryFromField(field: CountrySearchField, value: string) {
  switch (field) {
    case 'id':
      return eq(countriesTable.id, Number(value));
    case 'name':
      return eq(countriesTable.name, value);
    case 'cca3':
      return eq(countriesTable.cca3, value);
    case 'region':
      return eq(countriesTable.region, value);
    default:
      throw new Error(`Unsupported field: ${field}`);
  }
}
export async function getCountryBy(field: CountrySearchField, value: any) {
  try {
    const country = await db
      .select()
      .from(countriesTable)
      .where(getSearchQueryFromField(field, value))
      .limit(1);

    if (country.length === 0) {
      return null;
    }

    const languages = await getCountryLanguages(country[0]);

    const currencies = await getCountryCurrencies(country[0]);

    return {
      ...country[0],
      languages,
      currencies,
    };
  } catch (error) {
    console.error(`Error fetching country with ${field}=${value}:`, error);
    throw error;
  }
}

export async function getCountriesByLanguage(languageCode: string) {
  try {
    const countries = await db
      .select({
        country: countriesTable,
      })
      .from(countriesTable)
      .innerJoin(
        countryLanguages,
        eq(countriesTable.id, countryLanguages.countryId),
      )
      .innerJoin(
        languagesTable,
        eq(countryLanguages.languageId, languagesTable.id),
      )
      .where(eq(languagesTable.code, languageCode));
    if (countries.length === 0) {
      return [];
    }

    return Promise.all(
      countries.map(async (row) => {
        const languages = await getCountryLanguages(row.country);
        const currencies = await getCountryCurrencies(row.country);

        return {
          ...row.country,
          languages,
          currencies,
        };
      }),
    );
  } catch (error) {
    console.error(
      `Error fetching countries by language ${languageCode}:`,
      error,
    );
    throw error;
  }
}

export async function getCountriesByCurrency(currencyCode: string) {
  try {
    const countries = await db
      .select({
        country: countriesTable,
      })
      .from(countriesTable)
      .innerJoin(
        countryCurrencies,
        eq(countriesTable.id, countryCurrencies.countryId),
      )
      .innerJoin(
        currenciesTable,
        eq(countryCurrencies.currencyId, currenciesTable.id),
      )
      .where(eq(currenciesTable.code, currencyCode));

    if (countries.length === 0) {
      return [];
    }

    return Promise.all(
      countries.map(async (row) => {
        const languages = await getCountryLanguages(row.country);
        const currencies = await getCountryCurrencies(row.country);

        return {
          ...row.country,
          languages,
          currencies,
        };
      }),
    );
  } catch (error) {
    console.error(
      `Error fetching countries by currency ${currencyCode}:`,
      error,
    );
    throw error;
  }
}
