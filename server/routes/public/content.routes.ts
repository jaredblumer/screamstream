import type { Express } from 'express';
import { storage } from '@server/storage';
import { insertContentSchema } from '@shared/schema';
import { contentSyncService } from '@server/services/content-sync';

export function registerContentRoutes(app: Express) {
  app.get('/api/content', async (req, res) => {
    console.log('GET /api/content called');
    try {
      const {
        platform,
        year,
        minRating,
        minCriticsRating,
        minUsersRating,
        search,
        type,
        subgenre,
        sortBy,
      } = req.query;
      const filters: Parameters<typeof storage.getContent>[0] = {};

      if (platform && typeof platform === 'string') filters.platform = platform;
      if (year && typeof year === 'string') {
        if (year.endsWith('s')) filters.year = year;
        else if (year.includes('-')) filters.year = parseInt(year.split('-')[1]);
        else filters.year = parseInt(year);
      }
      if (minRating) filters.minRating = parseFloat(minRating as string);
      if (minCriticsRating) filters.minCriticsRating = parseFloat(minCriticsRating as string);
      if (minUsersRating) filters.minUsersRating = parseFloat(minUsersRating as string);
      if (search && typeof search === 'string') filters.search = search;
      if (type === 'movie' || type === 'series') filters.type = type;
      if (subgenre && typeof subgenre === 'string') filters.subgenre = subgenre;
      if (sortBy && typeof sortBy === 'string') filters.sortBy = sortBy as any;

      const content = await storage.getContent(filters);
      res.json(content);
    } catch (error) {
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
