import { db } from '@server/db';
import { platformImages } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { PlatformImage, InsertPlatformImage } from '@shared/schema';

export async function getPlatformImages(): Promise<PlatformImage[]> {
  return await db.select().from(platformImages).orderBy(platformImages.platformName);
}

export async function getPlatformImage(platformKey: string): Promise<PlatformImage | undefined> {
  const [image] = await db
    .select()
    .from(platformImages)
    .where(eq(platformImages.platformKey, platformKey));
  return image || undefined;
}

export async function createPlatformImage(data: InsertPlatformImage): Promise<PlatformImage> {
  const [newImage] = await db.insert(platformImages).values(data).returning();
  return newImage;
}

export async function updatePlatformImage(
  id: number,
  updates: Partial<InsertPlatformImage>
): Promise<PlatformImage | undefined> {
  const [updated] = await db
    .update(platformImages)
    .set(updates)
    .where(eq(platformImages.id, id))
    .returning();
  return updated || undefined;
}

export async function deletePlatformImage(id: number): Promise<boolean> {
  const result = await db.delete(platformImages).where(eq(platformImages.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}
