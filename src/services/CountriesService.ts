import { and, count, eq, isNotNull, notInArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';

import {
  countriesTable,
  Country,
  countryCurrenciesTable,
  countryLanguagesTable,
  currenciesTable,
  languagesTable,
  regionsTable,
  subregionsTable,
} from '../db/schema.js';
import {
  CountryApiInput,
  CurrencyInput,
  LanguageInput,
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

async function addLanguage(lang: LanguageInput) {
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

async function addCurrency(curr: CurrencyInput) {
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

async function getCountryLanguagesTable(country: Pick<Country, 'id'>) {
  const languages = await db
    .select({
      id: languagesTable.id,
      code: languagesTable.code,
      name: languagesTable.name,
    })
    .from(languagesTable)
    .innerJoin(
      countryLanguagesTable,
      eq(languagesTable.id, countryLanguagesTable.languageId),
    )
    .where(eq(countryLanguagesTable.countryId, country.id));
  return languages;
}

async function getCountryCurrenciesTable(country: Pick<Country, 'id'>) {
  const currencies = await db
    .select({
      id: currenciesTable.id,
      code: currenciesTable.code,
      name: currenciesTable.name,
    })
    .from(currenciesTable)
    .innerJoin(
      countryCurrenciesTable,
      eq(currenciesTable.id, countryCurrenciesTable.currencyId),
    )
    .where(eq(countryCurrenciesTable.countryId, country.id));
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

    const languages = await getCountryLanguagesTable(country[0]);

    const currencies = await getCountryCurrenciesTable(country[0]);

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
        countryLanguagesTable,
        eq(countriesTable.id, countryLanguagesTable.countryId),
      )
      .innerJoin(
        languagesTable,
        eq(countryLanguagesTable.languageId, languagesTable.id),
      )
      .where(eq(languagesTable.code, languageCode));
    if (countries.length === 0) {
      return [];
    }

    return Promise.all(
      countries.map(async (row) => {
        const languages = await getCountryLanguagesTable(row.country);
        const currencies = await getCountryCurrenciesTable(row.country);

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
        countryCurrenciesTable,
        eq(countriesTable.id, countryCurrenciesTable.countryId),
      )
      .innerJoin(
        currenciesTable,
        eq(countryCurrenciesTable.currencyId, currenciesTable.id),
      )
      .where(eq(currenciesTable.code, currencyCode));

    if (countries.length === 0) {
      return [];
    }

    return Promise.all(
      countries.map(async (row) => {
        const languages = await getCountryLanguagesTable(row.country);
        const currencies = await getCountryCurrenciesTable(row.country);

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

export interface DeleteResult {
  success: boolean;
  country?: {
    id: number;
    name: string;
  };
  relationships: {
    languages: number;
    currencies: number;
  };
}

export async function deleteCountry(id: number): Promise<DeleteResult> {
  try {
    return await db.transaction(async (tx) => {
      const [languageCount] = await tx
        .select({ count: count() })
        .from(countryLanguagesTable)
        .where(eq(countryLanguagesTable.countryId, id));

      const [currencyCount] = await tx
        .select({ count: count() })
        .from(countryCurrenciesTable)
        .where(eq(countryCurrenciesTable.countryId, id));

      const [country] = await tx
        .select({
          id: countriesTable.id,
          name: countriesTable.name,
          regionId: countriesTable.regionId,
          subregionId: countriesTable.subregionId,
          region: {
            id: regionsTable.id,
            name: regionsTable.name,
          },
          subregion: {
            id: subregionsTable.id,
            name: subregionsTable.name,
          },
        })
        .from(countriesTable)
        .leftJoin(regionsTable, eq(countriesTable.regionId, regionsTable.id))
        .leftJoin(
          subregionsTable,
          eq(countriesTable.subregionId, subregionsTable.id),
        )
        .where(eq(countriesTable.id, id))
        .limit(1);

      if (!country) {
        return {
          success: false,
          relationships: { languages: 0, currencies: 0 },
        };
      }

      await tx.delete(countriesTable).where(eq(countriesTable.id, id));

      const deletedSubregions = await tx
        .delete(subregionsTable)
        .where(
          notInArray(
            subregionsTable.id,
            tx
              .select({ id: countriesTable.subregionId })
              .from(countriesTable)
              .where(isNotNull(countriesTable.subregionId)),
          ),
        )
        .returning();

      const deletedRegions = await tx
        .delete(regionsTable)
        .where(
          and(
            notInArray(
              regionsTable.id,
              tx
                .select({ id: countriesTable.regionId })
                .from(countriesTable)
                .where(isNotNull(countriesTable.regionId)),
            ),
            notInArray(
              regionsTable.id,
              tx.select({ id: subregionsTable.regionId }).from(subregionsTable),
            ),
          ),
        )
        .returning();

      return {
        success: true,
        country: {
          id: country.id,
          name: country.name,
          region: country.region?.name
            ? {
                id: country.region.id,
                name: country.region.name,
              }
            : null,
          subregion: country.subregion?.name
            ? {
                id: country.subregion.id,
                name: country.subregion.name,
              }
            : null,
        },
        relationships: {
          languages: languageCount?.count || 0,
          currencies: currencyCount?.count || 0,
        },
        cleanup: {
          regions: deletedRegions.length,
          subregions: deletedSubregions.length,
        },
      };
    });
  } catch (error) {
    console.error(`Error deleting country ID ${id}:`, error);
    throw error;
  }
}
