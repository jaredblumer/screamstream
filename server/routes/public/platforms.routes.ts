// server/routes/public/platforms.routes.ts
import type { Express, Request, Response } from 'express';
import { Router } from 'express';
import { db } from '@server/db';
import { platforms } from '@shared/schema';
import { and, asc, eq, ilike, or } from 'drizzle-orm';

export function registerPlatformRoutes(app: Express) {
  const router = Router();

  /**
   * GET /api/platforms
   * Query params:
   *  - includeInactive=true | false (default false -> only active)
   *  - q=searchTerm (matches platformName or platformKey, case-insensitive)
   */
  router.get('/platforms', async (req: Request, res: Response) => {
    try {
      const includeInactive = String(req.query.includeInactive ?? '').toLowerCase() === 'true';
      const q = (req.query.q as string | undefined)?.trim();

      const where = [];

      if (!includeInactive) {
        where.push(eq(platforms.isActive, true));
      }

      if (q && q.length > 0) {
        const term = `%${q.toLowerCase()}%`;
        where.push(or(ilike(platforms.platformName, term), ilike(platforms.platformKey, term)));
      }

      const rows = await db
        .select({
          id: platforms.id,
          platformKey: platforms.platformKey,
          platformName: platforms.platformName,
          watchmodeId: platforms.watchmodeId,
          imageUrl: platforms.imageUrl,
          isActive: platforms.isActive,
        })
        .from(platforms)
        .where(where.length ? and(...where) : undefined)
        .orderBy(asc(platforms.platformName));

      res.json(rows);
    } catch (err) {
      console.error('GET /api/platforms failed:', err);
      res.status(500).json({ message: 'Failed to load platforms' });
    }
  });

  /**
   * GET /api/platforms/:id
   */
  router.get('/platforms/:id', async (req: Request, res: Response) => {
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
          isActive: platforms.isActive,
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

  /**
   * GET /api/platforms/by-key/:platformKey
   */
  router.get('/platforms/by-key/:platformKey', async (req: Request, res: Response) => {
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
          isActive: platforms.isActive,
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

  // Mount under /api
  app.use('/api', router);
}
