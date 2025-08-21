import { db } from '@server/db';
import { and, eq, inArray } from 'drizzle-orm';
import { contentPlatforms, platforms, InsertContentPlatform, PlatformBadge } from '@shared/schema';

export async function createContentPlatform(data: InsertContentPlatform & { contentId: number }) {
  const existing = await db
    .select()
    .from(contentPlatforms)
    .where(
      and(
        eq(contentPlatforms.contentId, data.contentId),
        eq(contentPlatforms.platformId, data.platformId)
      )
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(contentPlatforms)
      .set({
        webUrl: data.webUrl ?? existing[0].webUrl,
        seasons: data.seasons ?? existing[0].seasons,
        episodes: data.episodes ?? existing[0].episodes,
      })
      .where(
        and(
          eq(contentPlatforms.contentId, data.contentId),
          eq(contentPlatforms.platformId, data.platformId)
        )
      )
      .returning();
    return updated;
  }

  const [created] = await db.insert(contentPlatforms).values(data).returning();
  return created;
}

export async function updateContentPlatform(
  contentId: number,
  platformId: number,
  data: Partial<Pick<InsertContentPlatform, 'webUrl' | 'seasons' | 'episodes'>>
) {
  const [updated] = await db
    .update(contentPlatforms)
    .set({
      ...(data.webUrl !== undefined ? { webUrl: data.webUrl } : {}),
      ...(data.seasons !== undefined ? { seasons: data.seasons } : {}),
      ...(data.episodes !== undefined ? { episodes: data.episodes } : {}),
    })
    .where(
      and(eq(contentPlatforms.contentId, contentId), eq(contentPlatforms.platformId, platformId))
    )
    .returning();
  return updated;
}

export async function deleteContentPlatform(contentId: number, platformId: number) {
  const [deleted] = await db
    .delete(contentPlatforms)
    .where(
      and(eq(contentPlatforms.contentId, contentId), eq(contentPlatforms.platformId, platformId))
    )
    .returning();
  return deleted;
}

export async function getPlatformsForContentIds(contentIds: number[]) {
  try {
    const rows = await db
      .select({
        contentId: contentPlatforms.contentId,
        platformId: contentPlatforms.platformId,
        webUrl: contentPlatforms.webUrl,
        platformName: platforms.platformName,
        imageUrl: platforms.imageUrl,
      })
      .from(contentPlatforms)
      .innerJoin(platforms, eq(contentPlatforms.platformId, platforms.id))
      .where(inArray(contentPlatforms.contentId, contentIds))
      .orderBy(platforms.platformName);

    const map = new Map<number, PlatformBadge[]>();
    for (const row of rows) {
      const list = map.get(row.contentId) || [];
      list.push({
        platformId: row.platformId,
        platformName: row.platformName,
        imageUrl: row.imageUrl ?? '',
        webUrl: row.webUrl ?? undefined,
      });
      map.set(row.contentId, list);
    }
    return map;
  } catch (error) {
    console.error('Error fetching platforms for content IDs:', error);
    throw error;
  }
}

export async function getPlatformsForContentId(contentId: number): Promise<PlatformBadge[]> {
  const rows = await db
    .select({
      contentId: contentPlatforms.contentId,
      platformId: contentPlatforms.platformId,
      webUrl: contentPlatforms.webUrl,
      platformName: platforms.platformName,
      imageUrl: platforms.imageUrl,
    })
    .from(contentPlatforms)
    .innerJoin(platforms, eq(contentPlatforms.platformId, platforms.id))
    .where(eq(contentPlatforms.contentId, contentId))
    .orderBy(platforms.platformName);

  return rows.map((r) => ({
    platformId: r.platformId,
    platformName: r.platformName,
    imageUrl: r.imageUrl ?? '',
    webUrl: r.webUrl ?? undefined,
  }));
}
