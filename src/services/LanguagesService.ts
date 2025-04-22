import { eq } from 'drizzle-orm';
import { Language, languagesTable } from '../db/schema';
import { DB, Transaction } from '../db';

export async function findOrCreateLanguage(
  q: Transaction | DB,
  languageData: {
    code: string;
    name: string;
  },
): Promise<Language> {
  const [existingLang] = await q
    .select()
    .from(languagesTable)
    .where(eq(languagesTable.code, languageData.code))
    .limit(1);

  if (existingLang) {
    return existingLang;
  }

  const [newLang] = await q
    .insert(languagesTable)
    .values({
      code: languageData.code,
      name: languageData.name,
    })
    .returning();

  return newLang;
}
