import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  notInArray,
  or,
  SQL,
  sql,
} from 'drizzle-orm';
import { DB, db, Transaction } from '../db/index';

import {
  countriesTable,
  Country,
  countryCurrenciesTable,
  countryLanguagesRelations,
  countryLanguagesTable,
  currenciesTable,
  Currency,
  Language,
  languagesTable,
  Region,
  regionRelations,
  regionsTable,
  Subregion,
  subregionRelations,
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
import { CountryFilter, CountryListOptions } from '../types/countryFilters';

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
  includeRelations: boolean = true,
): Promise<CountryEntity | Country | undefined> {
  const countryResult = await q.query.countriesTable.findFirst({
    where: eq(countriesTable.id, countryId),
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

  return countryResult;
}

function buildCountryFilters(filter: CountryFilter = {}) {
  return (countriesTable: any, { eq, and, or, ilike, gte, lte, sql }: any) => {
    const clauses: any[] = [];

    if (filter.name) {
      clauses.push(ilike(countriesTable.name, `%${filter.name}%`));
    }
    if (filter.cca3) {
      clauses.push(eq(countriesTable.cca3, filter.cca3));
    }
    if (filter.population?.min != null) {
      clauses.push(gte(countriesTable.population, filter.population.min!));
    }
    if (filter.population?.max != null) {
      clauses.push(lte(countriesTable.population, filter.population.max!));
    }

    if (filter.region) {
      clauses.push(ilike(regionsTable.name, `%${filter.region}%`));
    }
    if (filter.subregion) {
      clauses.push(ilike(subregionsTable.name, `%${filter.subregion}%`));
    }

    if (filter.language) {
      clauses.push(
        or(
          ilike(languagesTable.name, `%${filter.language!}%`),
          ilike(languagesTable.code, `%${filter.language!}%`),
        ),
      );
    }

    if (filter.currency) {
      clauses.push(
        or(
          ilike(currenciesTable.name, `%${filter.currency}%`),
          ilike(currenciesTable.code, `%${filter.currency}%`),
        ),
      );
    }

    return clauses.length ? and(...clauses) : undefined;
  };
}

// Reusable sort builder function
function buildCountrySort(sort: { field: string; direction: 'asc' | 'desc' }) {
  const orderColumnMap = {
    name: countriesTable.name,
    population: countriesTable.population,
    region: regionsTable.name,
    subregion: subregionsTable.name,
    cca3: countriesTable.cca3,
    capital: countriesTable.capital,
  } as const;

  const col =
    (orderColumnMap as Record<string, any>)[sort.field] ?? countriesTable.name;

  const orderExpr = sort.direction === 'asc' ? asc(col) : desc(col);
  return orderExpr;
}

function buildRelations(
  includeRelations: boolean = true,
): Record<any, any> | undefined {
  return includeRelations
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
    : undefined;
}

export async function getCountries({
  pageSize = 25,
  page = 1,
  filter = {},
  sort = { field: 'name', direction: 'asc' },
}: CountryListOptions = {}): Promise<PaginatedResult<any>> {
  const [{ total: rawTotal }] = await db
    .select({ total: sql`COUNT(DISTINCT ${countriesTable.id})` })
    .from(countriesTable)
    .leftJoin(regionsTable, eq(countriesTable.regionId, regionsTable.id))
    .leftJoin(
      subregionsTable,
      eq(countriesTable.subregionId, subregionsTable.id),
    )
    .leftJoin(
      countryLanguagesTable,
      eq(countriesTable.id, countryLanguagesTable.countryId),
    )
    .leftJoin(
      languagesTable,
      eq(countryLanguagesTable.languageId, languagesTable.id),
    )
    .leftJoin(
      countryCurrenciesTable,
      eq(countriesTable.id, countryCurrenciesTable.countryId),
    )
    .leftJoin(
      currenciesTable,
      eq(countryCurrenciesTable.currencyId, currenciesTable.id),
    )
    .where(
      buildCountryFilters(filter)(countriesTable, {
        eq,
        and,
        or,
        ilike,
        gte,
        lte,
        sql,
      }),
    )
    .execute();
  const total = Number(rawTotal);

  const data = await db
    .select()
    .from(countriesTable)
    .leftJoin(regionsTable, eq(countriesTable.regionId, regionsTable.id))
    .leftJoin(
      subregionsTable,
      eq(countriesTable.subregionId, subregionsTable.id),
    )
    .leftJoin(
      countryLanguagesTable,
      eq(countriesTable.id, countryLanguagesTable.countryId),
    )
    .leftJoin(
      languagesTable,
      eq(countryLanguagesTable.languageId, languagesTable.id),
    )
    .leftJoin(
      countryCurrenciesTable,
      eq(countriesTable.id, countryCurrenciesTable.countryId),
    )
    .leftJoin(
      currenciesTable,
      eq(countryCurrenciesTable.currencyId, currenciesTable.id),
    )
    .where(
      buildCountryFilters(filter)(countriesTable, {
        eq,
        and,
        or,
        ilike,
        gte,
        lte,
        sql,
      }),
    )
    .orderBy(buildCountrySort(sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute();

  return {
    data,
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
