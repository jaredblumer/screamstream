import { db } from '@server/db';
import { watchlist, content, contentSubgenres, subgenres } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { Content } from '@shared/schema';

type WatchlistOptions = {
  includeHidden?: boolean;
  includeInactive?: boolean;
};

type SubgenreLite = { id: number; name: string; slug: string };

export type ContentWithSubgenres = Content & {
  subgenres: SubgenreLite[];
  primarySubgenre: SubgenreLite | null;
};

export async function getUserWatchlist(
  userId: number,
  options: WatchlistOptions = {}
): Promise<ContentWithSubgenres[]> {
  const conditions = [eq(watchlist.userId, userId)];

  if (!options.includeHidden) {
    conditions.push(eq(content.hidden, false));
  }

  if (!options.includeInactive) {
    conditions.push(eq(content.active, true));
  }

  // Base content for the user’s watchlist
  const results = await db
    .select({ content })
    .from(watchlist)
    .innerJoin(content, eq(watchlist.contentId, content.id))
    .where(and(...conditions));

  const rows = results.map((r) => r.content);
  if (rows.length === 0) return [];

  const contentIds = rows.map((c) => c.id);

  // Batch-fetch all subgenres for these content IDs
  const subRows = await db
    .select({
      contentId: contentSubgenres.contentId,
      id: subgenres.id,
      name: subgenres.name,
      slug: subgenres.slug,
    })
    .from(contentSubgenres)
    .innerJoin(subgenres, eq(contentSubgenres.subgenreId, subgenres.id))
    .where(inArray(contentSubgenres.contentId, contentIds));

  // Group subgenres by contentId
  const subsByContentId = new Map<number, SubgenreLite[]>();
  for (const r of subRows) {
    const list = subsByContentId.get(r.contentId) ?? [];
    list.push({ id: r.id, name: r.name, slug: r.slug });
    subsByContentId.set(r.contentId, list);
  }

  // Merge and resolve primary subgenre (if you store `primarySubgenre` as a slug on content)
  const withSubs: ContentWithSubgenres[] = rows.map((c) => {
    const subs = subsByContentId.get(c.id) ?? [];
    const primary = (c as any).primarySubgenre
      ? (subs.find((s) => s.slug === (c as any).primarySubgenre) ?? null)
      : null;

    return {
      ...c,
      subgenres: subs,
      primarySubgenre: primary,
    };
  });

  return withSubs;
}

export async function addToWatchlist(userId: number, contentId: number): Promise<boolean> {
  try {
    await db.insert(watchlist).values({ userId, contentId });
    return true;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return false;
  }
}

export async function removeFromWatchlist(userId: number, contentId: number): Promise<boolean> {
  const result = await db
    .delete(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.contentId, contentId)));

  return result.rowCount !== null && result.rowCount > 0;
}

export async function isInWatchlist(userId: number, contentId: number): Promise<boolean> {
  const [record] = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.contentId, contentId)));

  return !!record;
}
