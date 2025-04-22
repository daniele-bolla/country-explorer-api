import { eq } from 'drizzle-orm';
import { currenciesTable, Currency } from '../db/schema';
import { Transaction, DB } from '../db';

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
