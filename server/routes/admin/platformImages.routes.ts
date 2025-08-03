import type { Express } from 'express';
import { storage } from '../../storage';
import { insertPlatformImageSchema } from '@shared/schema';
import { requireAdmin } from '../../auth';

export function registerPlatformImageRoutes(app: Express) {
  app.get('/api/admin/platform-images', async (_req, res) => {
    try {
      const platformImages = await storage.getPlatformImages();
      res.json(platformImages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch platform images' });
    }
  });

  app.get('/api/admin/platform-images/:platformKey', requireAdmin, async (req, res) => {
    try {
      const platformKey = req.params.platformKey;
      const platformImage = await storage.getPlatformImage(platformKey);
      if (!platformImage) {
        return res.status(404).json({ message: 'Platform image not found' });
      }
      res.json(platformImage);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch platform image' });
    }
  });

  app.post('/api/admin/platform-images', requireAdmin, async (req, res) => {
    try {
      const validatedData = insertPlatformImageSchema.parse(req.body);
      const platformImage = await storage.createPlatformImage(validatedData);
      res.status(201).json(platformImage);
    } catch (error) {
      res.status(400).json({
        message: 'Failed to create platform image',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.put('/api/admin/platform-images/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid platform image ID' });

      const validatedData = insertPlatformImageSchema.parse(req.body);
      const platformImage = await storage.updatePlatformImage(id, validatedData);
      if (!platformImage) {
        return res.status(404).json({ message: 'Platform image not found' });
      }

      res.json(platformImage);
    } catch (error) {
      res.status(400).json({
        message: 'Failed to update platform image',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.delete('/api/admin/platform-images/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid platform image ID' });

      const success = await storage.deletePlatformImage(id);
      if (success) {
        res.json({ message: 'Platform image deleted successfully' });
      } else {
        res.status(404).json({ message: 'Platform image not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete platform image' });
    }
  });
}
