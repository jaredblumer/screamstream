import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';
import { requireAdmin } from '../../auth';
import { insertSubgenreSchema, updateSubgenreSchema } from '@shared/schema';

const listQuerySchema = z.object({
  activeOnly: z.coerce.boolean().optional().default(false),
});

export function registerAdminSubgenreRoutes(app: Express) {
  app.get('/api/admin/subgenres', requireAdmin, async (req, res) => {
    try {
      const { activeOnly } = listQuerySchema.parse(req.query);
      const rows = await storage.getSubgenres(activeOnly);
      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch subgenres',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/admin/subgenres/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid subgenre ID' });

      const row = await storage.getSubgenre(id);
      if (!row) return res.status(404).json({ message: 'Subgenre not found' });

      res.json(row);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch subgenre',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/admin/subgenres', requireAdmin, async (req, res) => {
    try {
      const data = insertSubgenreSchema.parse(req.body);
      const created = await storage.createSubgenre(data);
      res.status(201).json(created);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid payload', issues: error.issues });
      }
      if (error?.code === '23505' || /unique/i.test(String(error?.message))) {
        return res.status(409).json({ message: 'Name or slug already exists' });
      }
      res.status(500).json({
        message: 'Failed to create subgenre',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.patch('/api/admin/subgenres/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid subgenre ID' });

      const updates = updateSubgenreSchema.parse(req.body); // partial + strict
      const updated = await storage.updateSubgenre(id, updates);
      if (!updated) return res.status(404).json({ message: 'Subgenre not found' });

      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid payload', issues: error.issues });
      }
      if (error?.code === '23505' || /unique/i.test(String(error?.message))) {
        return res.status(409).json({ message: 'Name or slug already exists' });
      }
      res.status(500).json({
        message: 'Failed to update subgenre',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.delete('/api/admin/subgenres/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid subgenre ID' });

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
}
