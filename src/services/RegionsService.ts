import { DB, db, Transaction } from '../db';
import { Region, regionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function selectRegionbyName(
  q: Transaction | DB,
  regionName: string,
): Promise<Region> {
  const [existingRegion] = await q
    .select()
    .from(regionsTable)
    .where(eq(regionsTable.name, regionName))
    .limit(1);
  return existingRegion;
}
export async function selectRegionbyId(
  q: Transaction | DB,
  regionId: number,
): Promise<Region> {
  const [existingRegion] = await q
    .select()
    .from(regionsTable)
    .where(eq(regionsTable.id, regionId))
    .limit(1);
  return existingRegion;
}
export async function findOrCreateRegion(
  q: Transaction | DB,
  regionName: string,
): Promise<Region> {
  const existingRegion = await selectRegionbyName(q, regionName);
  if (existingRegion) {
    return existingRegion;
  }

  const [newRegion] = await q
    .insert(regionsTable)
    .values({
      name: regionName,
    })
    .returning();

  return newRegion;
}
