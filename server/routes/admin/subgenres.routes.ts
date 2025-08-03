import type { Express } from 'express';
import { storage } from '../../storage';
import { requireAdmin } from '../../auth';

export function registerAdminSubgenreRoutes(app: Express) {
  app.get('/api/admin/subgenres', requireAdmin, async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const subgenres = await storage.getSubgenres(activeOnly);
      res.json(subgenres);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch subgenres',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/admin/subgenres/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid subgenre ID' });

      const subgenre = await storage.getSubgenre(id);
      if (!subgenre) return res.status(404).json({ message: 'Subgenre not found' });

      res.json(subgenre);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch subgenre',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/admin/subgenres', requireAdmin, async (req, res) => {
    try {
      const { insertSubgenreSchema } = await import('@shared/schema');
      const validatedData = insertSubgenreSchema.parse(req.body);
      const newSubgenre = await storage.createSubgenre(validatedData);
      res.status(201).json(newSubgenre);
    } catch (error) {
      res.status(400).json({
        message: 'Failed to create subgenre',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.patch('/api/admin/subgenres/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid subgenre ID' });

      const updated = await storage.updateSubgenre(id, req.body);
      if (!updated) return res.status(404).json({ message: 'Subgenre not found' });

      res.json(updated);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update subgenre',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.delete('/api/admin/subgenres/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid subgenre ID' });

      const deleted = await storage.deleteSubgenre(id);
      if (!deleted) return res.status(404).json({ message: 'Subgenre not found' });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message: 'Failed to delete subgenre',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.put('/api/admin/subgenres/reorder', requireAdmin, async (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'number')) {
        return res.status(400).json({ message: 'orderedIds must be an array of numbers' });
      }

      const success = await storage.reorderSubgenres(orderedIds);
      if (!success) return res.status(500).json({ message: 'Failed to reorder subgenres' });

      res.json({ message: 'Subgenres reordered successfully' });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to reorder subgenres',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
