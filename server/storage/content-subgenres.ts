import { db } from '@server/db';
import { content, contentSubgenres, subgenres } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function addSubgenresToContent(contentId: number, subgenreIds: number[]) {
  if (!subgenreIds.length) return;
  await db
    .insert(contentSubgenres)
    .values(subgenreIds.map((sid) => ({ contentId, subgenreId: sid })))
    .onConflictDoNothing();
}

export async function removeSubgenresFromContent(contentId: number, subgenreIds: number[]) {
  if (!subgenreIds.length) return;
  await db
    .delete(contentSubgenres)
    .where(
      and(
        eq(contentSubgenres.contentId, contentId),
        inArray(contentSubgenres.subgenreId, subgenreIds)
      )
    );
}

export async function getSubgenreIdsForContent(contentId: number): Promise<number[]> {
  const rows = await db
    .select({ subgenreId: contentSubgenres.subgenreId })
    .from(contentSubgenres)
    .where(eq(contentSubgenres.contentId, contentId));
  return rows.map((r) => r.subgenreId);
}

export async function setPrimarySubgenre(
  contentId: number,
  subgenreId: number | null,
  ensureInJoin = true
) {
  await db.update(content).set({ primarySubgenreId: subgenreId }).where(eq(content.id, contentId));
  if (ensureInJoin && subgenreId) {
    await db.insert(contentSubgenres).values({ contentId, subgenreId }).onConflictDoNothing();
  }
}

export async function getSubgenresForContentDetailed(contentId: number) {
  return db
    .select({
      id: subgenres.id,
      name: subgenres.name,
      slug: subgenres.slug,
    })
    .from(contentSubgenres)
    .innerJoin(subgenres, eq(contentSubgenres.subgenreId, subgenres.id))
    .where(eq(contentSubgenres.contentId, contentId));
}
