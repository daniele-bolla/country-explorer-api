import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { DB, Transaction } from '../db/index';

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
  CountryResponse,
  SubregionInput,
} from '../types/countryModel';
import { CountryFilter } from '../types/countryFilters';

export function formattedCountryResponse(
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

export async function selectCountryById(
  q: Transaction | DB,
  countryId: Country['id'],
  includeRelations: boolean = true,
): Promise<CountryEntity | Country | undefined> {
  const countryResult = await q.query.countriesTable.findFirst({
    where: eq(countriesTable.id, countryId),
    with: buildRelations(includeRelations),
  });

  return countryResult;
}

export function buildCountryFilters(filter: CountryFilter = {}) {
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

export function buildRelations(
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

export function buildCountrySort(sort: {
  field: string;
  direction: 'asc' | 'desc';
}) {
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
export function applyFilterAandRelations(
  query: any,
  filter: CountryFilter = {},
) {
  return query
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
    );
}
export function groupCountryData(data: any) {
  const countryOrder: number[] = [];
  const seenCountryIds = new Set<number>();

  for (const row of data) {
    if (!seenCountryIds.has(row.id)) {
      countryOrder.push(row.id);
      seenCountryIds.add(row.id);
    }
  }

  interface CountryGrouped {
    country: Country;
    languages: Language[];
    currencies: Currency[];
    region: Region | null;
    subregion: Subregion | null;
  }

  interface DataRow extends Country {
    language?: Language | null;
    currency?: Currency | null;
    region?: Region | null;
    subregion?: Subregion | null;
  }

  const countriesMap = data.reduce(
    (acc: Record<number, CountryGrouped>, row: DataRow) => {
      const countryId = row.id;

      if (!acc[countryId]) {
        acc[countryId] = {
          country: row,
          languages: [],
          currencies: [],
          region: row.region ?? null,
          subregion: row.subregion ?? null,
        };
      }

      const language = row.language;
      if (
        language &&
        language.id &&
        !acc[countryId].languages.some((l: Language) => l.id === language.id)
      ) {
        acc[countryId].languages.push(language);
      }

      if (
        row.currency &&
        row.currency.id &&
        !acc[countryId].currencies.some(
          (c: Currency) => c.id === row.currency!.id,
        )
      ) {
        acc[countryId].currencies.push(row.currency);
      }

      return acc;
    },
    {},
  );

  const orderedCountries = countryOrder.map((id) => countriesMap[id]);
  return orderedCountries;
}
