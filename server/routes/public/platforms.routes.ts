import type { Express, Request, Response } from 'express';
import { db } from '@server/db';
import { platforms, content, contentPlatforms } from '@shared/schema';
import { asc, eq } from 'drizzle-orm';

export function registerPlatformRoutes(app: Express) {
  app.get('/api/platforms', async (req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          id: platforms.id,
          platformKey: platforms.platformKey,
          platformName: platforms.platformName,
          watchmodeId: platforms.watchmodeId,
          imageUrl: platforms.imageUrl,
        })
        .from(platforms)
        .orderBy(asc(platforms.platformName));

      res.json(rows);
    } catch (err) {
      console.error('GET /api/platforms failed:', err);
      res.status(500).json({ message: 'Failed to load platforms' });
    }
  });

  app.get('/api/platforms/with-active-content', async (req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          id: platforms.id,
          platformKey: platforms.platformKey,
          platformName: platforms.platformName,
          watchmodeId: platforms.watchmodeId,
          imageUrl: platforms.imageUrl,
        })
        .from(platforms)
        .innerJoin(contentPlatforms, eq(contentPlatforms.platformId, platforms.id))
        .innerJoin(content, eq(contentPlatforms.contentId, content.id))
        .where(eq(content.active, true as unknown as boolean))
        .groupBy(
          platforms.id,
          platforms.platformKey,
          platforms.platformName,
          platforms.watchmodeId,
          platforms.imageUrl
        )
        .orderBy(asc(platforms.platformName));

      res.json(rows);
    } catch (err) {
      console.error('GET /api/platforms/with-active-content failed:', err);
      res.status(500).json({ message: 'Failed to load platforms with active content' });
    }
  });

  app.get('/api/platforms/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid platform id' });
      }

      const [row] = await db
        .select({
          id: platforms.id,
          platformKey: platforms.platformKey,
          platformName: platforms.platformName,
          watchmodeId: platforms.watchmodeId,
          imageUrl: platforms.imageUrl,
        })
        .from(platforms)
        .where(eq(platforms.id, id))
        .limit(1);

      if (!row) return res.status(404).json({ message: 'Platform not found' });
      res.json(row);
    } catch (err) {
      console.error('GET /api/platforms/:id failed:', err);
      res.status(500).json({ message: 'Failed to load platform' });
    }
  });

  app.get('/api/platforms/by-key/:platformKey', async (req: Request, res: Response) => {
    try {
      const key = req.params.platformKey;
      if (!key) return res.status(400).json({ message: 'platformKey is required' });

      const [row] = await db
        .select({
          id: platforms.id,
          platformKey: platforms.platformKey,
          platformName: platforms.platformName,
          watchmodeId: platforms.watchmodeId,
          imageUrl: platforms.imageUrl,
        })
        .from(platforms)
        .where(eq(platforms.platformKey, key))
        .limit(1);

      if (!row) return res.status(404).json({ message: 'Platform not found' });
      res.json(row);
    } catch (err) {
      console.error('GET /api/platforms/by-key/:platformKey failed:', err);
      res.status(500).json({ message: 'Failed to load platform' });
    }
  });
}
