import { and, count, eq, isNotNull, notInArray, sql } from 'drizzle-orm';
import { DB, db, Transaction } from '../db/index';

import {
  countriesTable,
  Country,
  countryCurrenciesTable,
  countryLanguagesTable,
  Currency,
  Language,
  Region,
  regionsTable,
  Subregion,
  subregionsTable,
} from '../db/schema';
import {
  CountryInput,
  CountryResponse,
  RegionInput,
  SubregionInput,
} from '../types/countryModel';
import { findOrCreateRegion } from './RegionsService';
import { findOrCreateLanguage } from './LanguagesService';
import { findOrCreateSubregion } from './SubRegionsService';
import { findOrCreateCurrency } from './CurrenciesService';
import {
  createCurrencyRelations,
  createLanguageRelations,
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
  region: RegionInput | null,
  subregion: Omit<SubregionInput, 'regionId'> | null,
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

export async function getCountryById(
  id: number,
): Promise<CountryResponse | null> {
  try {
    return await db.transaction(async (tx) => {
      const [countryWithRelations] = await db
        .select({
          country: {
            id: countriesTable.id,
            name: countriesTable.name,
            cca3: countriesTable.cca3,
            capital: countriesTable.capital,
            population: countriesTable.population,
            flagSvg: countriesTable.flagSvg,
            flagPng: countriesTable.flagPng,
            createdAt: countriesTable.createdAt,
            updatedAt: countriesTable.updatedAt,
            regionId: countriesTable.regionId,
            subregionId: countriesTable.subregionId,
          },
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

      if (!countryWithRelations) {
        throw new Error('not found');
      }

      const { country, region, subregion } = countryWithRelations;

      const [languages, currencies] = await Promise.all([
        getCountryLanguages(tx, id),
        getCountryCurrencies(tx, id),
      ]);

      return formattedCountryResponse(
        country,
        region,
        subregion,
        languages,
        currencies,
      );
    });
  } catch (error) {
    console.error(`Error fetching country ID ${id}:`, error);
    throw error;
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
    const [existingCountry] = await tx
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.cca3, data.cca3))
      .limit(1);

    if (existingCountry) {
      throw new Error(`Country with code ${data.cca3} already exists`);
    }

    let regionId: number | null = null;
    let regionData: Region | undefined;

    if (data.region) {
      regionData = await findOrCreateRegion(tx, data.region);
      regionId = regionData.id;
    }

    let subregionId: number | null = null;
    let subregionData: Subregion | undefined;

    if (data.subregion && regionId) {
      subregionData = await findOrCreateSubregion(tx, data.subregion, regionId);
      subregionId = subregionData.id;
    }

    const country = await createCountryEntity(tx, data);

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

    return {
      ...country,
      region: regionData?.name,
      subregion: subregionData?.name,
      languages: languages,
      currencies: currencies,
    };
  });
}
interface DeleteResult {
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
        throw new Error('not found');
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
// Update basic country fields
async function updateCountryEntity(
  tx: Transaction | DB,
  countryId: number,
  data: Partial<Country>,
): Promise<Country> {
  // Only include fields that are explicitly provided
  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.cca3 !== undefined) updateData.cca3 = data.cca3;
  if (data.capital !== undefined) updateData.capital = data.capital;
  if (data.population !== undefined) updateData.population = data.population;
  if (data.flagSvg !== undefined) updateData.flagSvg = data.flagSvg;
  if (data.flagPng !== undefined) updateData.flagPng = data.flagPng;

  if (Object.keys(updateData).length === 0) {
    const [country] = await tx
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.id, countryId))
      .limit(1);

    return country;
  }

  const [updatedCountry] = await tx
    .update(countriesTable)
    .set(updateData)
    .where(eq(countriesTable.id, countryId))
    .returning();

  return updatedCountry;
}

export async function updateCountry(
  countryId: number,
  data: UpdateCountryInput,
): Promise<any> {
  return await db.transaction(async (tx) => {
    // First check if country exists
    const [existingCountry] = await tx
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.id, countryId))
      .limit(1);

    if (!existingCountry) {
      throw new Error(`Country with ID ${countryId} not found`);
    }

    // If cca3 is being updated, check it's not already in use by another country
    if (data.cca3 && data.cca3 !== existingCountry.cca3) {
      const [conflictingCountry] = await tx
        .select()
        .from(countriesTable)
        .where(eq(countriesTable.cca3, data.cca3))
        .limit(1);

      if (conflictingCountry && conflictingCountry.id !== countryId) {
        throw new Error(`Country with code ${data.cca3} already exists`);
      }
    }

    // Initialize variables to track updates
    let regionId = existingCountry.regionId;
    let regionName: string | undefined;
    let subregionId = existingCountry.subregionId;
    let subregionName: string | undefined;
    let languages: Language[] = [];
    let currencies: Currency[] = [];

    // 1. Update basic fields
    const updatedCountry = await updateCountryEntity(tx, countryId, {
      name: data.name,
      cca3: data.cca3,
      capital: data.capital,
      population: data.population,
      flagSvg: data.flagSvg,
      flagPng: data.flagPng,
    });

    // 2. Update region if provided
    if (data.region) {
      const regionResult = await updateCountryRegion(
        tx,
        countryId,
        data.region,
      );
      regionId = regionResult.regionId;
      regionName = regionResult.regionName;
    } else if (existingCountry.regionId) {
      // If not updating, but region exists, get the data
      const [region] = await tx
        .select()
        .from(regionsTable)
        .where(eq(regionsTable.id, existingCountry.regionId))
        .limit(1);

      if (region) {
        regionName = region.name;
      }
    }

    // 3. Update subregion if provided and region exists
    if (data.subregion && regionId) {
      const subregionResult = await updateCountrySubregion(
        tx,
        countryId,
        data.subregion,
        regionId,
      );
      subregionId = subregionResult.subregionId;
      subregionName = subregionResult.subregionName;
    } else if (existingCountry.subregionId) {
      const [subregion] = await tx
        .select()
        .from(subregionsTable)
        .where(eq(subregionsTable.id, existingCountry.subregionId))
        .limit(1);

      if (subregion) {
        subregionName = subregion.name;
      }
    }

    // 4. Update languages if provided
    if (data.languages && data.languages.length > 0) {
      languages = await updateCountryLanguages(tx, countryId, data.languages);
    } else {
      // If not updating languages, fetch existing ones
      languages = await getCountryLanguages(tx, countryId);
    }

    // 5. Update currencies if provided
    if (data.currencies && data.currencies.length > 0) {
      currencies = await updateCountryCurrencies(
        tx,
        countryId,
        data.currencies,
      );
    } else {
      // If not updating currencies, fetch existing ones
      currencies = await getCountryCurrencies(tx, countryId);
    }

    return {
      ...updatedCountry,
      region: regionName,
      subregion: subregionName,
      languages,
      currencies,
    };
  });
}
