import { db } from '@server/db'; // Adjust to your actual DB import
import { platforms } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { popularStreamingPlatforms } from '@server/watchmode';

export async function getOrCreatePlatformByWatchmodeId(watchmodeId: number) {
  // Try to find existing platform
  const [existing] = await db
    .select()
    .from(platforms)
    .where(eq(platforms.watchmodeId, watchmodeId));

  if (existing) return existing;

  // Fallback: try to match by Watchmode ID from known popular platforms
  const entry = Object.entries(popularStreamingPlatforms).find(([, id]) => id === watchmodeId);

  if (!entry) {
    throw new Error(`Unknown platform for watchmodeId ${watchmodeId}`);
  }

  const [platformName, _id] = entry;
  const platformKey = platformName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  const [created] = await db
    .insert(platforms)
    .values({
      platformKey,
      platformName,
      watchmodeId,
    })
    .returning();

  return created;
}
