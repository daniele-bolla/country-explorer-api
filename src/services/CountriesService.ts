import { and, eq, isNotNull, notInArray, sql } from 'drizzle-orm';
import { DB, db, Transaction } from '../db/index';

import {
  countriesTable,
  Country,
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
  CountryInput,
  CountryResponse,
  UpdateCountryInput,
} from '../types/countryModel';
import { findOrCreateRegion, selectRegionbyId } from './RegionsService';
import { findOrCreateLanguage } from './LanguagesService';
import {
  findOrCreateSubregion,
  selectSubregionbyId,
} from './SubRegionsService';
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
import {
  applyFilterAandRelations,
  buildCountrySort,
  formattedCountryResponse,
  groupCountryData,
  selectCountryById,
} from '../utils/countriesHelpers';

export async function getCountries({
  pageSize = 25,
  page = 1,
  filter = {},
  sort = { field: 'name', direction: 'asc' },
}: CountryListOptions = {}): Promise<PaginatedResult<any>> {
  return await db.transaction(async (tx) => {
    const totalSelectQuery = tx.select({
      total: sql`COUNT(DISTINCT ${countriesTable.id})`,
    });

    const [{ total: rawTotal }] = await applyFilterAandRelations(
      totalSelectQuery,
      filter,
    ).execute();
    const total = Number(rawTotal);
    const orderByQuery = buildCountrySort(sort);
    const dataSelectQuery = tx.select({
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
      region: regionsTable,
      subregion: subregionsTable,
      language: languagesTable,
      currency: currenciesTable,
    });
    const data = await applyFilterAandRelations(dataSelectQuery, filter)
      .orderBy(orderByQuery)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    const countryOrder: number[] = [];
    const seenCountryIds = new Set<number>();

    for (const row of data) {
      if (!seenCountryIds.has(row.id)) {
        countryOrder.push(row.id);
        seenCountryIds.add(row.id);
      }
    }

    const orderedCountries = groupCountryData(data);

    const formattedData = orderedCountries.map(
      ({ country, region, subregion, languages, currencies }) =>
        formattedCountryResponse(
          country,
          region,
          subregion,
          languages,
          currencies,
        ),
    );
    return {
      data: formattedData,
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  });
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
    let subregion: Subregion | null = null;

    let languages: Language[] = [];
    let currencies: Currency[] = [];

    const updatedCountry = await updateCountryEntity(tx, countryId, data);

    if (data.region) {
      region = await updateCountryRegion(tx, countryId, data.region);
    } else if (existingCountry.regionId) {
      const selectedRegion = await selectRegionbyId(
        tx,
        existingCountry.regionId,
      );

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
      const selectedSubregion = await selectSubregionbyId(
        tx,
        existingCountry.subregionId,
      );

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
