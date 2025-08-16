import { db } from '@server/db';
import { contentPlatforms, platforms, InsertContentPlatform, PlatformBadge } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';

export async function createContentPlatform(data: InsertContentPlatform & { contentId: number }) {
  const [created] = await db.insert(contentPlatforms).values(data).returning();
  return created;
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
      .where(inArray(contentPlatforms.contentId, contentIds));

    const map = new Map<number, any[]>();
    for (const row of rows) {
      const list = map.get(row.contentId) || [];
      list.push({
        platformId: row.platformId,
        platformName: row.platformName,
        imageUrl: row.imageUrl,
        webUrl: row.webUrl,
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
    .where(eq(contentPlatforms.contentId, contentId));

  return rows.map((r) => ({
    platformId: r.platformId,
    platformName: r.platformName,
    imageUrl: r.imageUrl ?? '',
    webUrl: r.webUrl ?? undefined,
  }));
}
