import { DB, Transaction } from '../db';
import { Subregion, subregionsTable } from '../db/schema';
import { and, eq } from 'drizzle-orm';

export async function findOrCreateSubregion(
  q: Transaction | DB,
  subregionName: string,
  regionId: number,
): Promise<Subregion> {
  const [existingSubregion] = await q
    .select()
    .from(subregionsTable)
    .where(
      and(
        eq(subregionsTable.name, subregionName),
        eq(subregionsTable.regionId, regionId),
      ),
    )
    .limit(1);

  if (existingSubregion) {
    return existingSubregion;
  }

  const [newSubregion] = await q
    .insert(subregionsTable)
    .values({
      name: subregionName,
      regionId,
      updatedAt: new Date(),
    })
    .returning();

  return newSubregion;
}
