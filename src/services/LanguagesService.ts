import { eq, sql } from 'drizzle-orm';
import { Language, languagesTable } from '../db/schema';
import { DB, Transaction } from '../db';
import { LanguageInput } from '../types/countryModel';

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

export async function bulkCreateLanguages(
  q: Transaction | DB,
  languagesInputs: LanguageInput[],
): Promise<Language[] | []> {
  if (languagesInputs.length) {
    const insertedLanguages = await q
      .insert(languagesTable)
      .values(languagesInputs)
      .onConflictDoUpdate({
        target: languagesTable.code,
        set: {
          name: sql`excluded.name`,
        },
      })
      .returning();
    return insertedLanguages;
  } else {
    return [];
  }
}
