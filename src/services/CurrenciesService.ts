import { eq, sql } from 'drizzle-orm';
import { currenciesTable, Currency } from '../db/schema';
import { Transaction, DB } from '../db';
import { CurrencyInput } from '../types/countryModel';

export async function findOrCreateCurrency(
  q: Transaction | DB,
  currencyData: {
    code: string;
    name: string;
  },
): Promise<Currency> {
  const [existingCurr] = await q
    .select()
    .from(currenciesTable)
    .where(eq(currenciesTable.code, currencyData.code))
    .limit(1);

  if (existingCurr) {
    return existingCurr;
  }

  const [newCurr] = await q
    .insert(currenciesTable)
    .values({
      code: currencyData.code,
      name: currencyData.name,
    })
    .returning();

  return newCurr;
}
export async function bulkCreateCurrencies(
  q: Transaction | DB,
  CurrenciesInputs: CurrencyInput[],
): Promise<Currency[] | []> {
  if (CurrenciesInputs.length) {
    const insertedCurrencies = await q
      .insert(currenciesTable)
      .values(CurrenciesInputs)
      .onConflictDoUpdate({
        target: currenciesTable.code,
        set: {
          name: sql`excluded.name`,
        },
      })
      .returning();
    return insertedCurrencies;
  } else {
    return [];
  }
}
