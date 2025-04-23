import { db } from '../db';
import {
  countriesTable,
  regionsTable,
  subregionsTable,
  languagesTable,
  currenciesTable,
  countryLanguagesTable,
  countryCurrenciesTable,
} from '../db/schema';

export async function clearDatabase() {
  await db.delete(countryLanguagesTable);
  await db.delete(countryCurrenciesTable);
  await db.delete(countriesTable);
  await db.delete(subregionsTable);
  await db.delete(regionsTable);
  await db.delete(languagesTable);
  await db.delete(currenciesTable);
}
