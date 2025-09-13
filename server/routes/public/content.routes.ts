import type { Express } from 'express';
import { storage } from '@server/storage';
import { insertContentSchema } from '@shared/schema';
import { contentSyncService } from '@server/services/content-sync';

export function registerContentRoutes(app: Express) {
  app.get('/api/content', async (req, res) => {
    try {
      const q = req.query as Record<string, string | string[] | undefined>;
      const norm = (v?: string) => (v && v !== 'all' ? v : undefined);
      const normNum = (v?: string) => (v && v !== 'all' ? Number(v) : undefined);
      const platform = Array.isArray(q.platform)
        ? q.platform[0]
        : (q.platform as string | undefined);

      const filters: Parameters<typeof storage.getContent>[0] = {
        platform: norm(platform),
        year: (() => {
          const y = Array.isArray(q.year) ? q.year[0] : (q.year as string | undefined);
          if (!y || y === 'all') return undefined;
          if (y.endsWith('s')) return y;
          const n = Number(y);
          return Number.isFinite(n) ? n : undefined;
        })(),
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
        search: norm(Array.isArray(q.search) ? q.search[0] : (q.search as string | undefined)),
        type: (() => {
          const t = Array.isArray(q.type) ? q.type[0] : (q.type as string | undefined);
          return t && t !== 'all' && (t === 'movie' || t === 'series') ? t : undefined;
        })(),
        subgenre: norm(
          Array.isArray(q.subgenre) ? q.subgenre[0] : (q.subgenre as string | undefined)
        ),

        // ONLY "<field>:<dir>" allowed
        sortBy: (() => {
          const raw = Array.isArray(q.sortBy) ? q.sortBy[0] : (q.sortBy as string | undefined);
          if (!raw) return 'average_rating:desc';
          const [field, dir] = raw.split(':');
          const fields = new Set([
            'average_rating',
            'critics_rating',
            'users_rating',
            'release_date',
          ]);
          const dirs = new Set(['asc', 'desc']);
          return fields.has(field) && dirs.has(dir)
            ? (`${field}:${dir}` as any)
            : 'average_rating:desc';
        })(),

        includeHidden:
          (Array.isArray(q.includeHidden) ? q.includeHidden[0] : q.includeHidden) === 'true',
        includeInactive:
          (Array.isArray(q.includeInactive) ? q.includeInactive[0] : q.includeInactive) === 'true',
      };

      const rows = await storage.getContent(filters, {
        includeSubgenres: true,
        includePrimary: true,
      });
      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/content/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid content ID' });

      const item = await storage.getContentItemWithSubgenres(id);
      if (!item) return res.status(404).json({ message: 'Not found' });

      res.json(item);
    } catch (err: any) {
      res
        .status(500)
        .json({ message: 'Failed to fetch content item', error: err?.message ?? 'Unknown' });
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
