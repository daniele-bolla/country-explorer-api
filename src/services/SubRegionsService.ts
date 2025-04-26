import { DB, Transaction } from '../db';
import { Subregion, subregionsTable } from '../db/schema';
import { and, eq, Name } from 'drizzle-orm';
import { SubregionInput } from '../types/countryModel';
export async function selectSubregionbyName(
  q: Transaction | DB,
  subregionName: string,
): Promise<Subregion> {
  const [existingRegion] = await q
    .select()
    .from(subregionsTable)
    .where(eq(subregionsTable.name, subregionName))
    .limit(1);
  return existingRegion;
}
export async function selectSubregionbyId(
  q: Transaction | DB,
  subregionId: number,
): Promise<Subregion> {
  const [existingRegion] = await q
    .select()
    .from(subregionsTable)
    .where(eq(subregionsTable.id, subregionId))
    .limit(1);
  return existingRegion;
}
export async function findOrCreateSubregion(
  q: Transaction | DB,
  subregionName: string,
  regionId: number,
): Promise<Subregion> {
  const existingSubregion = await selectSubregionbyName(q, subregionName);

  if (existingSubregion) {
    return existingSubregion;
  }

  const [newSubregion] = await q
    .insert(subregionsTable)
    .values({
      name: subregionName,
      regionId,
    })
    .returning();

  return newSubregion;
}

export async function bulkCreateSubregions(
  q: Transaction | DB,
  subregions: SubregionInput[],
): Promise<Subregion[] | []> {
  if (subregions.length) {
    const newSubregions = await q
      .insert(subregionsTable)
      .values(subregions)
      .onConflictDoNothing()
      .returning();

    return newSubregions;
  } else {
    return [];
  }
}
