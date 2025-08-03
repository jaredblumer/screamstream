import { db } from '../db';
import { subgenres } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { Subgenre, InsertSubgenre } from '@shared/schema';

export async function getSubgenres(activeOnly = false): Promise<Subgenre[]> {
  let query = db.select().from(subgenres);

  if (activeOnly) {
    query = query.where(eq(subgenres.isActive, true));
  }

  return await query.orderBy(subgenres.sortOrder, subgenres.name);
}

export async function getSubgenre(id: number): Promise<Subgenre | undefined> {
  const [record] = await db.select().from(subgenres).where(eq(subgenres.id, id));
  return record || undefined;
}

export async function getSubgenreBySlug(slug: string): Promise<Subgenre | undefined> {
  const [record] = await db.select().from(subgenres).where(eq(subgenres.slug, slug));
  return record || undefined;
}

export async function createSubgenre(data: InsertSubgenre): Promise<Subgenre> {
  const [newSubgenre] = await db.insert(subgenres).values(data).returning();
  return newSubgenre;
}

export async function updateSubgenre(
  id: number,
  updates: Partial<InsertSubgenre>
): Promise<Subgenre | undefined> {
  const [updated] = await db.update(subgenres).set(updates).where(eq(subgenres.id, id)).returning();
  return updated || undefined;
}

export async function deleteSubgenre(id: number): Promise<boolean> {
  const result = await db.delete(subgenres).where(eq(subgenres.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

export async function reorderSubgenres(orderedIds: number[]): Promise<boolean> {
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(subgenres)
        .set({ sortOrder: i + 1 })
        .where(eq(subgenres.id, orderedIds[i]));
    }
    return true;
  } catch (error) {
    console.error('Error reordering subgenres:', error);
    return false;
  }
}
