import type { Express } from 'express';
import { storage } from '../../storage';
import { insertContentSchema } from '@shared/schema';
import { requireAuth, requireAdmin } from '../../auth';

export function registerAdminContentRoutes(app: Express) {
  app.get('/api/admin/content', requireAdmin, async (_req, res) => {
    try {
      const content = await storage.getContent({ includeHidden: false, includeInactive: false });
      res.json(content);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/admin/content', requireAdmin, async (req, res) => {
    try {
      const validatedData = insertContentSchema.parse(req.body);
      const newContent = await storage.createContent(validatedData);
      res.status(201).json(newContent);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to create content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.patch('/api/admin/content/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedContent = await storage.updateContent(id, updateData);

      if (!updatedContent) {
        return res.status(404).json({ message: 'Content not found' });
      }

      res.json(updatedContent);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.delete('/api/admin/content/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContent(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Content not found' });
      }

      res.json({ message: 'Content deleted successfully' });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to delete content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/admin/content/hidden', requireAuth, requireAdmin, async (_req, res) => {
    try {
      const hiddenContent = await storage.getHiddenContent();
      res.json(hiddenContent);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch hidden content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/admin/content/inactive', requireAuth, requireAdmin, async (_req, res) => {
    try {
      const inactiveContent = await storage.getInactiveContent();
      res.json(inactiveContent);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch inactive content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/admin/content/:id/hide', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid content ID' });

      const success = await storage.hideContent(id);
      if (success) {
        res.json({ message: 'Content hidden successfully', id });
      } else {
        res.status(404).json({ message: 'Content not found' });
      }
    } catch (error) {
      res.status(500).json({
        message: 'Failed to hide content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/admin/content/:id/show', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid content ID' });

      const success = await storage.showContent(id);
      if (success) {
        res.json({ message: 'Content shown successfully', id });
      } else {
        res.status(404).json({ message: 'Content not found' });
      }
    } catch (error) {
      res.status(500).json({
        message: 'Failed to show content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
