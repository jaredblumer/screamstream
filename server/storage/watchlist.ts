import { db } from '../db';
import { watchlist, content } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { Content } from '@shared/schema';

export async function getUserWatchlist(userId: number): Promise<Content[]> {
  const results = await db
    .select({ content })
    .from(watchlist)
    .innerJoin(content, eq(watchlist.contentId, content.id))
    .where(eq(watchlist.userId, userId));

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
