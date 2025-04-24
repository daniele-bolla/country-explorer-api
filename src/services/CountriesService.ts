import { and, eq, isNotNull, notInArray, sql } from 'drizzle-orm';
import { DB, db, Transaction } from '../db/index';

import {
  countriesTable,
  Country,
  Currency,
  Language,
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
import { PaginatedResult, PaginationOptions } from '../types/pagination';

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

// export async function getCountriesWithFilters({
//   pageSize = 25,
//   page = 1,
//   filter = {},
//   sort = { field: 'name', direction: 'asc' },
//   includeRelations = false,
// }: CountryListOptions = {}): Promise<PaginatedResult<CountryResponse>> {
//   try {
//     // Step 1: Use SQL builder to get IDs that match filters
//     let filterQuery = db.select({ id: countriesTable.id }).from(countriesTable);

//     // Apply basic filters
//     if (filter.name) {
//       filterQuery = filterQuery.where(
//         ilike(countriesTable.name, `%${filter.name}%`),
//       );
//     }

//     if (filter.cca3) {
//       filterQuery = filterQuery.where(eq(countriesTable.cca3, filter.cca3));
//     }

//     if (filter.population?.min) {
//       filterQuery = filterQuery.where(
//         gte(countriesTable.population, filter.population.min),
//       );
//     }

//     if (filter.population?.max) {
//       filterQuery = filterQuery.where(
//         lte(countriesTable.population, filter.population.max),
//       );
//     }

//     // Apply advanced filters that need joins
//     if (filter.region) {
//       filterQuery = filterQuery
//         .leftJoin(regionsTable, eq(countriesTable.regionId, regionsTable.id))
//         .where(ilike(regionsTable.name, `%${filter.region}%`));
//     }

//     if (filter.subregion) {
//       filterQuery = filterQuery
//         .leftJoin(
//           subregionsTable,
//           eq(countriesTable.subregionId, subregionsTable.id),
//         )
//         .where(ilike(subregionsTable.name, `%${filter.subregion}%`));
//     }

//     if (filter.language) {
//       filterQuery = filterQuery
//         .leftJoin(
//           countryLanguagesTable,
//           eq(countryLanguagesTable.countryId, countriesTable.id),
//         )
//         .leftJoin(
//           languagesTable,
//           eq(languagesTable.id, countryLanguagesTable.languageId),
//         )
//         .where(
//           or(
//             ilike(languagesTable.name, `%${filter.language}%`),
//             ilike(languagesTable.code, `%${filter.language}%`),
//           ),
//         );
//     }

//     if (filter.currency) {
//       filterQuery = filterQuery
//         .leftJoin(
//           countryCurrenciesTable,
//           eq(countryCurrenciesTable.countryId, countriesTable.id),
//         )
//         .leftJoin(
//           currenciesTable,
//           eq(currenciesTable.id, countryCurrenciesTable.currencyId),
//         )
//         .where(
//           or(
//             ilike(currenciesTable.name, `%${filter.currency}%`),
//             ilike(currenciesTable.code, `%${filter.currency}%`),
//           ),
//         );
//     }

//     // Get distinct country IDs matching our filters
//     const filteredIds = await filterQuery
//       .groupBy(countriesTable.id)
//       .orderBy(countriesTable.id);

//     // Step 2: Count total matching countries
//     const totalCount = filteredIds.length;

//     // Step 3: Apply pagination to IDs
//     const paginatedIds = filteredIds
//       .slice((page - 1) * pageSize, page * pageSize)
//       .map((row) => row.id);

//     // Early return if no results
//     if (paginatedIds.length === 0) {
//       return {
//         data: [],
//         meta: {
//           total: totalCount,
//           page,
//           pageSize,
//           pageCount: Math.ceil(totalCount / pageSize),
//         },
//       };
//     }

//     // Step 4: Now use the query builder with findMany to get the full data with relations
//     let queryOptions: any = {
//       where: inArray(countriesTable.id, paginatedIds),
//     };

//     // Add relations if requested
//     if (includeRelations) {
//       queryOptions.with = {
//         region: true,
//         subregion: true,
//         languages: {
//           with: {
//             language: true,
//           },
//         },
//         currencies: {
//           with: {
//             currency: true,
//           },
//         },
//       };
//     }

//     // Apply sorting
//     const { field, direction } = sort;
//     if (field in countriesTable) {
//       queryOptions.orderBy = (columns: any) => [
//         direction === 'desc'
//           ? desc(columns[field as keyof typeof columns])
//           : asc(columns[field as keyof typeof columns]),
//       ];
//     }

//     // Execute the query
//     const countries = await db.query.countriesTable.findMany(queryOptions);

//     // Format the results
//     const formattedCountries = countries.map((country) => {
//       if (includeRelations) {
//         const languages = country.languages
//           ? country.languages.map((rel) => rel.language)
//           : [];

//         const currencies = country.currencies
//           ? country.currencies.map((rel) => rel.currency)
//           : [];

//         return formattedCountryResponse(
//           country,
//           country.region || null,
//           country.subregion || null,
//           languages,
//           currencies,
//         );
//       } else {
//         return {
//           ...country,
//           region: null,
//           subregion: null,
//           languages: [],
//           currencies: [],
//         };
//       }
//     });

//     // Return paginated result
//     return {
//       data: formattedCountries,
//       meta: {
//         total: totalCount,
//         page,
//         pageSize,
//         pageCount: Math.ceil(totalCount / pageSize),
//       },
//     };

// }
export const getCountries = async ({
  pageSize = 25,
  page = 1,
}: PaginationOptions = {}): Promise<PaginatedResult<Country>> => {
  const countries = await db.query.countriesTable.findMany({
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
  // const countries = await db
  //   .select()
  //   .from(countriesTable)
  //   .limit(pageSize)
  //   .offset((page - 1) * pageSize);

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
