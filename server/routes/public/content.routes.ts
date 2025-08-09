import type { Express } from 'express';
import { storage } from '@server/storage';
import { insertContentSchema } from '@shared/schema';
import { contentSyncService } from '@server/services/content-sync';

export function registerContentRoutes(app: Express) {
  app.get('/api/content', async (req, res) => {
    console.log('GET /api/content', req.query);
    try {
      const q = req.query as Record<string, string | string[] | undefined>;

      // helper: normalize "all" / empty → undefined
      const norm = (v?: string) => (v && v !== 'all' ? v : undefined);
      const normNum = (v?: string) => (v && v !== 'all' ? Number(v) : undefined);

      // allow platform to be a single string (platformKey) or comma‑separated string (rare)
      const platform = Array.isArray(q.platform)
        ? q.platform[0]
        : (q.platform as string | undefined);

      const filters: Parameters<typeof storage.getContent>[0] = {
        // platformKey (e.g. "netflix"); storage will match key or name via EXISTS
        platform: norm(platform),

        // decade ("2010s") or a specific year ("2024"); storage handles both
        year: (() => {
          const y = Array.isArray(q.year) ? q.year[0] : (q.year as string | undefined);
          if (!y || y === 'all') return undefined;
          if (y.endsWith('s')) return y; // "2010s"
          const n = Number(y);
          return Number.isFinite(n) ? n : undefined;
        })(),

        // ratings: numeric
        minRating: normNum(
          Array.isArray(q.minRating) ? q.minRating[0] : (q.minRating as string | undefined)
        ),
        minCriticsRating: normNum(
          Array.isArray(q.minCriticsRating)
            ? q.minCriticsRating[0]
            : (q.minCriticsRating as string | undefined)
        ),
        minUsersRating: normNum(
          Array.isArray(q.minUsersRating)
            ? q.minUsersRating[0]
            : (q.minUsersRating as string | undefined)
        ),

        // optional text search
        search: norm(Array.isArray(q.search) ? q.search[0] : (q.search as string | undefined)),

        // 'movie' | 'series'
        type: (() => {
          const t = Array.isArray(q.type) ? q.type[0] : (q.type as string | undefined);
          return t && t !== 'all' && (t === 'movie' || t === 'series') ? t : undefined;
        })(),

        // subgenre slug
        subgenre: norm(
          Array.isArray(q.subgenre) ? q.subgenre[0] : (q.subgenre as string | undefined)
        ),

        // sortBy whitelist + default
        sortBy: (() => {
          const s = Array.isArray(q.sortBy) ? q.sortBy[0] : (q.sortBy as string | undefined);
          const allowed = new Set([
            'average_rating',
            'critics_rating',
            'users_rating',
            'year_newest',
            'year_oldest',
          ]);
          return s && allowed.has(s) ? (s as any) : 'average_rating';
        })(),

        // optional: includeHidden=true
        includeHidden:
          (Array.isArray(q.includeHidden) ? q.includeHidden[0] : q.includeHidden) === 'true',
      };

      const rows = await storage.getContent(filters);
      res.json(rows);
    } catch (error) {
      console.error('GET /api/content failed:', error);
      res.status(500).json({
        message: 'Failed to fetch content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/content/:id', async (req, res) => {
    console.log('GET /api/content/:id called with params:', req.params);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid content ID' });

      const content = await storage.getContentItem(id);
      if (!content) return res.status(404).json({ message: 'Content not found' });

      res.json(content);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/content', async (req, res) => {
    try {
      const validatedData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(validatedData);
      res.status(201).json(content);
    } catch (error) {
      res.status(400).json({
        message: 'Failed to create content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/content/sync', async (req, res) => {
    try {
      const result = await contentSyncService.syncHorrorContent(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to sync content' });
    }
  });
}
