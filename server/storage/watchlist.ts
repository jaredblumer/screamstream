import { db } from '@server/db';
import { watchlist, content } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { Content } from '@shared/schema';

type WatchlistOptions = {
  includeHidden?: boolean;
  includeInactive?: boolean;
};

export async function getUserWatchlist(
  userId: number,
  options: WatchlistOptions = {}
): Promise<Content[]> {
  const conditions = [eq(watchlist.userId, userId)];

  if (!options.includeHidden) {
    conditions.push(eq(content.hidden, false));
  }

  if (!options.includeInactive) {
    conditions.push(eq(content.active, true));
  }

  const results = await db
    .select({ content })
    .from(watchlist)
    .innerJoin(content, eq(watchlist.contentId, content.id))
    .where(and(...conditions));

  return results.map((r) => r.content);
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
