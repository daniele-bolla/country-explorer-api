import {
  and,
  count,
  eq,
  gte,
  ilike,
  isNotNull,
  lte,
  notInArray,
  sql,
} from 'drizzle-orm';
import { DB, db, Transaction } from '../db/index';

import {
  countriesTable,
  Country,
  countryCurrenciesTable,
  countryLanguagesTable,
  currenciesTable,
  Currency,
  Language,
  languagesTable,
  Region,
  regionsTable,
  Subregion,
  subregionsTable,
} from '../db/schema';
import {
  CountryEntity,
  CountryInput,
  CountryResponse,
  SubregionInput,
} from '../types/countryModel';
import { findOrCreateRegion } from './RegionsService';
import { findOrCreateLanguage } from './LanguagesService';
import { findOrCreateSubregion } from './SubRegionsService';
import { findOrCreateCurrency } from './CurrenciesService';
import {
  createCurrencyRelations,
  createLanguageRelations,
  createRegionRelation,
  createSubregionRelation,
  getCountryCurrencies,
  getCountryLanguages,
  updateCountryCurrencies,
  updateCountryLanguages,
  updateCountryRegion,
  updateCountrySubregion,
} from './CountriesRelationsService';
import { PaginatedResult } from '../types/pagination';
import { CountryListOptions } from '../types/countryFilters';

function formattedCountryResponse(
  country: Country,
  region: Partial<Region> | null,
  subregion: Partial<SubregionInput> | null,
  languages: Language[],
  currencies: Currency[],
): CountryResponse {
  return {
    ...country,
    region: region?.name,
    subregion: subregion?.name,
    languages,
    currencies,
  };
}

async function selectCountryById(
  q: Transaction | DB,
  countryId: Country['id'],
): Promise<CountryEntity | undefined> {
  const countryResult = await q.query.countriesTable.findFirst({
    where: eq(countriesTable.id, countryId),
    with: {
      region: true,
      subregion: true,
      languages: {
        with: {
          language: true,
        },
      },
      currencies: {
        with: {
          currency: true,
        },
      },
    },
  });

  return countryResult;
}

export async function getCountries({
  pageSize = 25,
  page = 1,
  filter = {},
  sort = { field: 'name', direction: 'asc' },
  includeRelations = false,
}: CountryListOptions = {}): Promise<PaginatedResult<any>> {
  const whereConditions = [];

  if (filter.name) {
    whereConditions.push(ilike(countriesTable.name, `%${filter.name}%`));
  }

  if (filter.cca3) {
    whereConditions.push(eq(countriesTable.cca3, filter.cca3));
  }

  if (filter.population?.min) {
    whereConditions.push(gte(countriesTable.population, filter.population.min));
  }

  if (filter.population?.max) {
    whereConditions.push(lte(countriesTable.population, filter.population.max));
  }

  // Get total count for pagination
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(countriesTable)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  // Execute query with all options
  const countries = await db.query.countriesTable.findMany({
    where: (countries, { eq, and, or, sql, ilike }) => {
      const conditions = [];

      if (filter.name) {
        conditions.push(ilike(countries.name, `%${filter.name}%`));
      }

      if (filter.cca3) {
        conditions.push(eq(countries.cca3, filter.cca3));
      }

      if (filter.population?.min) {
        conditions.push(gte(countries.population, filter.population.min));
      }

      if (filter.population?.max) {
        conditions.push(lte(countries.population, filter.population.max));
      }

      if (filter.region) {
        whereConditions.push(sql`exists (
          select 1 from ${regionsTable}
          where ${regionsTable.id} = ${countries.regionId}
          and ${ilike(regionsTable.name, `%${filter.region}%`)}
        )`);
      }

      if (filter.subregion) {
        conditions.push(sql`exists (
          select 1 from ${subregionsTable}
          where ${subregionsTable.id} = ${countries.subregionId}
          and ${ilike(subregionsTable.name, `%${filter.subregion}%`)}
        )`);
      }

      if (filter.language) {
        conditions.push(sql`exists (
          select 1 from ${countryLanguagesTable}
          join ${languagesTable} on ${languagesTable.id} = ${countryLanguagesTable.languageId}
          where ${countryLanguagesTable.countryId} = ${countries.id}
          and (${ilike(languagesTable.name, `%${filter.language}%`)} 
               or ${ilike(languagesTable.code, `%${filter.language}%`)})
        )`);
      }

      if (filter.currency) {
        conditions.push(sql`exists (
          select 1 from ${countryCurrenciesTable}
          join ${currenciesTable} on ${currenciesTable.id} = ${countryCurrenciesTable.currencyId}
          where ${countryCurrenciesTable.countryId} = ${countries.id}
          and (${ilike(currenciesTable.name, `%${filter.currency}%`)} 
               or ${ilike(currenciesTable.code, `%${filter.currency}%`)})
        )`);
      }

      return conditions.length ? and(...conditions) : undefined;
    },
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: (countries, { asc, desc }) => {
      if (sort.field === 'name') {
        return sort.direction === 'desc'
          ? desc(countries.name)
          : asc(countries.name);
      }
      if (sort.field === 'population') {
        return sort.direction === 'desc'
          ? desc(countries.population)
          : asc(countries.population);
      }
      return asc(countries.id); // Default sort
    },
    with: includeRelations
      ? {
          region: true,
          subregion: true,
          languages: {
            with: {
              language: true,
            },
          },
          currencies: {
            with: {
              currency: true,
            },
          },
        }
      : undefined,
  });

  return {
    data: countries,
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    },
  };
}

export async function getCountryById(countryId: Country['id']): Promise<any> {
  const country = await selectCountryById(db, countryId);
  if (!country) {
    throw new Error(`Country with ID ${countryId} not found`);
  }
  return country;
}

export async function bulkCreateCountriesEntity(
  q: Transaction | DB,
  countriesInputs: CountryInput[],
): Promise<Country[] | []> {
  if (countriesInputs.length) {
    const insertedCountries = await q
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
    return insertedCountries;
  } else {
    return [];
  }
}

async function createCountryEntity(
  q: Transaction | DB,
  data: CountryInput,
): Promise<Country> {
  const [country] = await q.insert(countriesTable).values(data).returning();
  return country;
}

export async function createCountry(
  data: CountryInput,
): Promise<CountryResponse> {
  return await db.transaction(async (tx) => {
    const existingCountry = await tx.query.countriesTable.findFirst({
      where: eq(countriesTable.cca3, data.cca3),
    });

    if (existingCountry) {
      throw new Error(`Country with code ${data.cca3} already exists`);
    }

    const country = await createCountryEntity(tx, data);

    let region: Region | null = null;

    if (data.region) {
      region = await findOrCreateRegion(tx, data.region);
      await createRegionRelation(tx, country.id, region.id);
    }

    let subregion: Subregion | null = null;

    if (data.subregion && region && region.id) {
      subregion = await findOrCreateSubregion(tx, data.subregion, region.id);
      await createSubregionRelation(tx, country.id, subregion.id);
    }

    const languages: Language[] = [];

    if (data.languages && data.languages.length > 0) {
      for (const langData of data.languages) {
        const language = await findOrCreateLanguage(tx, langData);
        languages.push(language);
      }

      await createLanguageRelations(tx, country.id, languages);
    }

    const currencies: Currency[] = [];

    if (data.currencies && data.currencies.length > 0) {
      for (const currData of data.currencies) {
        const currency = await findOrCreateCurrency(tx, currData);
        currencies.push(currency);
      }

      await createCurrencyRelations(tx, country.id, currencies);
    }
    return formattedCountryResponse(
      country,
      region,
      subregion,
      languages,
      currencies,
    );
  });
}
interface DeleteResult {
  country?: {
    id: number;
    name: string;
  };
  cleanup: {
    regions: number;
    subregions: number;
  };
}
export async function deleteCountry(
  countryId: Country['id'],
): Promise<DeleteResult> {
  return await db.transaction(async (tx) => {
    const country = await selectCountryById(tx, countryId);
    if (!country) {
      throw new Error(`Country with ID ${countryId} not found`);
    }
    await tx.delete(countriesTable).where(eq(countriesTable.id, countryId));

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
      country,
      cleanup: {
        regions: deletedRegions.length,
        subregions: deletedSubregions.length,
      },
    };
  });
}

export interface UpdateCountryInput {
  name?: string;
  cca3?: string;
  capital?: string[];
  region?: string;
  subregion?: string;
  population?: number;
  flagSvg?: string;
  flagPng?: string;
  languages?: Array<{ code: string; name: string }>;
  currencies?: Array<{ code: string; name: string }>;
}

async function updateCountryEntity(
  tx: Transaction | DB,
  countryId: number,
  data: Partial<Country>,
): Promise<Country> {
  const [updatedCountry] = await tx
    .update(countriesTable)
    .set(data)
    .where(eq(countriesTable.id, countryId))
    .returning();

  return updatedCountry;
}

export async function updateCountry(
  data: UpdateCountryInput,
  countryId: number,
): Promise<CountryResponse> {
  return await db.transaction(async (tx) => {
    const existingCountry = await tx.query.countriesTable.findFirst({
      where: eq(countriesTable.id, countryId),
    });

    if (!existingCountry) {
      throw new Error(`Country with ID ${countryId} not found`);
    }

    if (data.cca3 && data.cca3 !== existingCountry.cca3) {
      const conflictingCountry = await tx.query.countriesTable.findFirst({
        where: eq(countriesTable.cca3, data.cca3),
      });

      if (conflictingCountry && conflictingCountry.id !== countryId) {
        throw new Error(`Country with code ${data.cca3} already exists`);
      }
    }

    let region: Region | null = null;
    let subregion: Region | null = null;

    let languages: Language[] = [];
    let currencies: Currency[] = [];

    // 1. Update basic fields
    const updatedCountry = await updateCountryEntity(tx, countryId, data);

    if (data.region) {
      region = await updateCountryRegion(tx, countryId, data.region);
    } else if (existingCountry.regionId) {
      const [selectedRegion] = await tx
        .select()
        .from(regionsTable)
        .where(eq(regionsTable.id, existingCountry.regionId))
        .limit(1);

      if (selectedRegion) {
        region = selectedRegion;
      }
    }

    if (data.subregion && region && region.id) {
      subregion = await updateCountrySubregion(
        tx,
        countryId,
        data.subregion,
        region.id,
      );
    } else if (existingCountry.subregionId) {
      const [selectedSubregion] = await tx
        .select()
        .from(subregionsTable)
        .where(eq(subregionsTable.id, existingCountry.subregionId))
        .limit(1);

      if (selectedSubregion) {
        subregion = selectedSubregion;
      }
    }

    if (data.languages && data.languages.length > 0) {
      languages = await updateCountryLanguages(tx, countryId, data.languages);
    } else {
      languages = await getCountryLanguages(tx, countryId);
    }

    if (data.currencies && data.currencies.length > 0) {
      currencies = await updateCountryCurrencies(
        tx,
        countryId,
        data.currencies,
      );
    } else {
      currencies = await getCountryCurrencies(tx, countryId);
    }

    return formattedCountryResponse(
      updatedCountry,
      region,
      subregion,
      languages,
      currencies,
    );
  });
}
