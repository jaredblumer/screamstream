import type { Express, Request, Response } from 'express';
import { db } from '@server/db';
import { and, eq, desc, sql } from 'drizzle-orm';
import { content, contentPlatforms, platforms, contentSubgenres, subgenres } from '@shared/schema';

export function registerDecadeRoutes(app: Express) {
  app.get('/api/decades', async (req: Request, res: Response) => {
    try {
      const { platformKey, type, subgenre } = req.query as {
        platformKey?: string;
        type?: 'movie' | 'series' | 'all';
        subgenre?: string; // slug
      };

      // Base conditions
      const conditions = [eq(content.active, true), eq(content.hidden, false)];
      if (type && type !== 'all') {
        conditions.push(eq(content.type, type));
      }

      // Reusable decade expression: year - (year % 10)
      const decadeExpr = sql<number>`(${content.year} - (${content.year} % 10))`;

      // Start query
      let q = db
        .select({
          decade: decadeExpr,
          count: sql<number>`count(*)`,
        })
        .from(content);

      // Optional platform filter (reassign the builder!)
      if (platformKey && platformKey !== 'all') {
        q = q
          .innerJoin(contentPlatforms, eq(contentPlatforms.contentId, content.id))
          .innerJoin(platforms, eq(platforms.id, contentPlatforms.platformId));
        conditions.push(eq(platforms.platformKey, platformKey));
      }

      // Optional subgenre filter
      if (subgenre && subgenre !== 'all') {
        q = q
          .innerJoin(contentSubgenres, eq(contentSubgenres.contentId, content.id))
          .innerJoin(subgenres, eq(subgenres.id, contentSubgenres.subgenreId));
        conditions.push(eq(subgenres.slug, subgenre));
      }

      const rows = await q
        .where(and(...conditions))
        .groupBy(decadeExpr)
        .orderBy(desc(decadeExpr));

      // rows: [{ decade: 1990, count: 42 }, ...]
      res.json(rows);
    } catch (e) {
      console.error('GET /api/decades failed:', e);
      res.status(500).json({ error: 'Failed to load decades' });
    }
  });
}
