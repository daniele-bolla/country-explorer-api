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
} from '../db/schema';
import { findOrCreateCurrency } from './CurrenciesService';
import { findOrCreateRegion } from './RegionsService';
import { findOrCreateSubregion } from './SubRegionsService';
import { findOrCreateLanguage } from './LanguagesService';

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

// Update country region
export async function updateCountryRegion(
  q: Transaction | DB,
  countryId: number,
  regionName: string,
): Promise<{ regionId: number; regionName: string }> {
  // Find or create the region
  const region = await findOrCreateRegion(q, regionName);

  // Update the country with the new region
  await q
    .update(countriesTable)
    .set({
      regionId: region.id,
    })
    .where(eq(countriesTable.id, countryId));

  return { regionId: region.id, regionName: region.name };
}

// Update country subregion
export async function updateCountrySubregion(
  q: Transaction,
  countryId: number,
  subregionName: string,
  regionId: number,
): Promise<{ subregionId: number; subregionName: string }> {
  // Find or create the subregion
  const subregion = await findOrCreateSubregion(q, subregionName, regionId);

  // Update the country with the new subregion
  await q
    .update(countriesTable)
    .set({
      subregionId: subregion.id,
      updatedAt: new Date(),
    })
    .where(eq(countriesTable.id, countryId));

  return { subregionId: subregion.id, subregionName: subregion.name };
}

// Update country languages
export async function updateCountryLanguages(
  q: Transaction,
  countryId: number,
  languagesData: Array<{ code: string; name: string }>,
): Promise<Language[]> {
  // Remove existing language associations
  await q
    .delete(countryLanguagesTable)
    .where(eq(countryLanguagesTable.countryId, countryId));

  const languages: Language[] = [];

  // Create new language associations
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

// Update country currencies
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
