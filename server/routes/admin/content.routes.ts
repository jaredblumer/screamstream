import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';
import { insertContentSchema } from '@shared/schema';
import { requireAuth, requireAdmin } from '../../auth';

import {
  addSubgenresToContent,
  removeSubgenresFromContent,
  getSubgenreIdsForContent,
  getSubgenresForContentDetailed,
  setPrimarySubgenre,
} from '../../storage/content-subgenres';

const createBodySchema = insertContentSchema.extend({
  subgenreIds: z.array(z.number().int().positive()).default([]),
});

const updateBodySchema = insertContentSchema.partial().extend({
  subgenreIds: z.array(z.number().int().positive()).optional(),
});

export function registerAdminContentRoutes(app: Express) {
  app.get('/api/admin/content', requireAdmin, async (_req, res) => {
    try {
      const content = await storage.getContent(
        { includeHidden: false, includeInactive: false },
        { includeSubgenres: true, includePrimary: true }
      );
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
      const { subgenreIds, ...contentData } = createBodySchema.parse(req.body);

      const newContent = await storage.createContent(contentData);

      if (subgenreIds.length) {
        await addSubgenresToContent(newContent.id, subgenreIds);
      }

      // ensure FK is set and present in the join (if provided)
      await setPrimarySubgenre(newContent.id, contentData.primarySubgenreId ?? null, true);

      res.status(201).json(newContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid payload', issues: error.issues });
      }
      res.status(500).json({
        message: 'Failed to create content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.patch('/api/admin/content/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid content ID' });
      }

      const parsed = updateBodySchema.parse(req.body);
      const { subgenreIds, primarySubgenreId, ...updateData } = parsed;

      const updatedContent = await storage.updateContent(id, updateData);
      if (!updatedContent) {
        return res.status(404).json({ message: 'Content not found' });
      }

      if (typeof primarySubgenreId !== 'undefined') {
        await setPrimarySubgenre(id, primarySubgenreId ?? null, true);
      }

      if (Array.isArray(subgenreIds)) {
        const current = await getSubgenreIdsForContent(id);
        const toAdd = subgenreIds.filter((x) => !current.includes(x));
        const toRemove = current.filter((x) => !subgenreIds.includes(x));
        if (toAdd.length) await addSubgenresToContent(id, toAdd);
        if (toRemove.length) await removeSubgenresFromContent(id, toRemove);
      }

      res.json(updatedContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid payload', issues: error.issues });
      }
      res.status(500).json({
        message: 'Failed to update content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.delete('/api/admin/content/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid content ID' });
      }

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
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid content ID' });
      }

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
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid content ID' });
      }

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

  app.get('/api/admin/content/:id/subgenres', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid content ID' });

      const [ids, detailed] = await Promise.all([
        getSubgenreIdsForContent(id),
        getSubgenresForContentDetailed(id),
      ]);

      // get primary FK inline to avoid another storage call
      const [row] = await db
        .select({ primarySubgenreId: content.primarySubgenreId })
        .from(content)
        .where(eq(content.id, id));

      res.json({
        primarySubgenreId: row?.primarySubgenreId ?? null,
        subgenreIds: ids,
        subgenres: detailed, // [{id,name,slug}, ...]
      });
    } catch (e) {
      res.status(500).json({
        message: 'Failed to load subgenres',
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  });

  const addBody = z.object({ subgenreIds: z.array(z.number().int().positive()).min(1) });
  app.post('/api/admin/content/:id/subgenres', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid content ID' });
      const { subgenreIds } = addBody.parse(req.body);

      await addSubgenresToContent(id, subgenreIds);
      const detailed = await getSubgenresForContentDetailed(id);
      res.json({ subgenres: detailed });
    } catch (e) {
      res.status(500).json({
        message: 'Failed to add subgenres',
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  });

  const replaceBody = z.object({ subgenreIds: z.array(z.number().int().positive()).default([]) });
  app.put('/api/admin/content/:id/subgenres', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid content ID' });
      const { subgenreIds } = replaceBody.parse(req.body);

      const current = await getSubgenreIdsForContent(id);
      const toAdd = subgenreIds.filter((x) => !current.includes(x));
      const toRemove = current.filter((x) => !subgenreIds.includes(x));

      if (toAdd.length) await addSubgenresToContent(id, toAdd);
      if (toRemove.length) await removeSubgenresFromContent(id, toRemove);

      const detailed = await getSubgenresForContentDetailed(id);
      res.json({ subgenres: detailed });
    } catch (e) {
      res.status(500).json({
        message: 'Failed to replace subgenres',
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  });

  app.delete('/api/admin/content/:id/subgenres/:subgenreId', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const subgenreId = Number(req.params.subgenreId);
      if (Number.isNaN(id) || Number.isNaN(subgenreId)) {
        return res.status(400).json({ message: 'Invalid IDs' });
      }

      await removeSubgenresFromContent(id, [subgenreId]);
      const detailed = await getSubgenresForContentDetailed(id);
      res.json({ subgenres: detailed });
    } catch (e) {
      res.status(500).json({
        message: 'Failed to remove subgenre',
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  });

  const primaryBody = z.object({ primarySubgenreId: z.number().int().positive().nullable() });
  app.patch('/api/admin/content/:id/primary-subgenre', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid content ID' });
      const { primarySubgenreId } = primaryBody.parse(req.body);

      await setPrimarySubgenre(id, primarySubgenreId ?? null, true);
      res.json({ primarySubgenreId });
    } catch (e) {
      res.status(500).json({
        message: 'Failed to set primary',
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  });
}
