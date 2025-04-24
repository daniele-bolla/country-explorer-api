import { DB, Transaction } from '../db';
import { eq } from 'drizzle-orm';

import {
  countriesTable,
  countryCurrenciesTable,
  countryLanguagesTable,
  currenciesTable,
  Currency,
  Language,
  languagesTable,
  Region,
  Subregion,
} from '../db/schema';

import { findOrCreateCurrency } from './CurrenciesService';
import { findOrCreateRegion } from './RegionsService';
import { findOrCreateSubregion } from './SubRegionsService';
import { findOrCreateLanguage } from './LanguagesService';

export async function createRegionRelation(
  tx: Transaction,
  countryId: number,
  regionId: number,
): Promise<void> {
  await tx
    .update(countriesTable)
    .set({
      regionId,
    })
    .where(eq(countriesTable.id, countryId));
}

export async function createSubregionRelation(
  tx: Transaction,
  countryId: number,
  subregionId: number,
): Promise<void> {
  await tx
    .update(countriesTable)
    .set({
      subregionId,
    })
    .where(eq(countriesTable.id, countryId));
}
export async function createLanguageRelations(
  q: Transaction | DB,
  countryId: number,
  languages: Language[],
): Promise<void> {
  for (const language of languages) {
    await q
      .insert(countryLanguagesTable)
      .values({
        countryId,
        languageId: language.id,
      })
      .onConflictDoNothing();
  }
}

type CountryLanguagesIds = {
  countryId: number;
  languageId: number;
};
export async function bulkCreateLanguageRelations(
  q: Transaction | DB,
  countryLanguagesInputs: CountryLanguagesIds[],
): Promise<void> {
  if (countryLanguagesInputs.length) {
    await q
      .insert(countryLanguagesTable)
      .values(countryLanguagesInputs)
      .onConflictDoNothing();
  }
}

export async function createCurrencyRelations(
  q: Transaction | DB,
  countryId: number,
  currencies: Currency[],
): Promise<void> {
  for (const currency of currencies) {
    await q
      .insert(countryCurrenciesTable)
      .values({
        countryId,
        currencyId: currency.id,
      })
      .onConflictDoNothing();
  }
}

type CountryCurrenciesIds = {
  countryId: number;
  currencyId: number;
};
export async function bulkCreateCurrencyRelations(
  q: Transaction | DB,
  countryCurrenciesInputs: CountryCurrenciesIds[],
): Promise<void> {
  if (countryCurrenciesInputs.length) {
    await q
      .insert(countryCurrenciesTable)
      .values(countryCurrenciesInputs)
      .onConflictDoNothing();
  }
}

export async function getCountryLanguages(
  q: Transaction | DB,
  countryId: number,
): Promise<Language[]> {
  const languagesResult = await q
    .select({
      language: languagesTable,
    })
    .from(countryLanguagesTable)
    .innerJoin(
      languagesTable,
      eq(countryLanguagesTable.languageId, languagesTable.id),
    )
    .where(eq(countryLanguagesTable.countryId, countryId));

  return languagesResult.map((result) => result.language);
}

export async function getCountryCurrencies(
  q: Transaction | DB,
  countryId: number,
): Promise<Currency[]> {
  const currenciesResult = await q
    .select({
      currency: currenciesTable,
    })
    .from(countryCurrenciesTable)
    .innerJoin(
      currenciesTable,
      eq(countryCurrenciesTable.currencyId, currenciesTable.id),
    )
    .where(eq(countryCurrenciesTable.countryId, countryId));

  return currenciesResult.map((result) => result.currency);
}

export async function updateCountryRegion(
  q: Transaction | DB,
  countryId: number,
  regionName: string,
): Promise<Region> {
  const region = await findOrCreateRegion(q, regionName);

  await q
    .update(countriesTable)
    .set({
      regionId: region.id,
    })
    .where(eq(countriesTable.id, countryId))
    .returning();

  return region;
}

export async function updateCountrySubregion(
  q: Transaction,
  countryId: number,
  subregionName: string,
  regionId: number,
): Promise<Subregion> {
  const subregion = await findOrCreateSubregion(q, subregionName, regionId);

  await q
    .update(countriesTable)
    .set({
      subregionId: subregion.id,
    })
    .where(eq(countriesTable.id, countryId))
    .returning();

  return subregion;
}

export async function updateCountryLanguages(
  q: Transaction,
  countryId: number,
  languagesData: Array<{ code: string; name: string }>,
): Promise<Language[]> {
  await q
    .delete(countryLanguagesTable)
    .where(eq(countryLanguagesTable.countryId, countryId));

  const languages: Language[] = [];

  for (const langData of languagesData) {
    const language = await findOrCreateLanguage(q, langData);
    languages.push(language);

    await q
      .insert(countryLanguagesTable)
      .values({
        countryId,
        languageId: language.id,
      })
      .onConflictDoNothing();
  }
  return languages;
}

export async function updateCountryCurrencies(
  tx: Transaction,
  countryId: number,
  currenciesData: Array<{ code: string; name: string }>,
): Promise<Currency[]> {
  await tx
    .delete(countryCurrenciesTable)
    .where(eq(countryCurrenciesTable.countryId, countryId));

  const currencies: Currency[] = [];

  for (const currData of currenciesData) {
    const currency = await findOrCreateCurrency(tx, currData);
    currencies.push(currency);

    await tx
      .insert(countryCurrenciesTable)
      .values({
        countryId,
        currencyId: currency.id,
      })
      .onConflictDoNothing();
  }

  return currencies;
}
