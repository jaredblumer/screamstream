import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';
import { requireAuth, requireAdmin } from '../../auth';

const upsertSchema = z.object({
  platformId: z.number().int().positive(),
  webUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((s) => (s === '' ? null : s)),
  seasons: z.number().int().positive().optional(),
  episodes: z.number().int().positive().optional(),
});

export function registerAdminContentPlatformRoutes(app: Express) {
  // GET existing platform links for a content item
  app.get(
    '/api/admin/content/:contentId/platforms',
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const contentId = Number(req.params.contentId);
        if (Number.isNaN(contentId)) {
          return res.status(400).json({ message: 'Invalid contentId' });
        }
        const rows = await storage.getPlatformsForContentId(contentId);
        res.json(rows);
      } catch (error) {
        console.error('GET /api/admin/content/:contentId/platforms failed:', error);
        res.status(500).json({
          message: 'Failed to load content platforms',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // POST add (or merge) a platform link
  app.post(
    '/api/admin/content/:contentId/platforms',
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const contentId = Number(req.params.contentId);
        if (Number.isNaN(contentId)) {
          return res.status(400).json({ message: 'Invalid contentId' });
        }
        const parsed = upsertSchema.parse(req.body);

        const created = await storage.createContentPlatform({
          contentId,
          platformId: parsed.platformId,
          webUrl: (parsed.webUrl ?? undefined) as string | undefined,
          seasons: parsed.seasons,
          episodes: parsed.episodes,
        });

        res.status(201).json(created);
      } catch (error) {
        console.error('POST /api/admin/content/:contentId/platforms failed:', error);
        res.status(400).json({
          message: 'Failed to add content platform',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // PATCH update link fields for a specific platform on a content item
  app.patch(
    '/api/admin/content/:contentId/platforms/:platformId',
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const contentId = Number(req.params.contentId);
        const platformId = Number(req.params.platformId);
        if (Number.isNaN(contentId) || Number.isNaN(platformId)) {
          return res.status(400).json({ message: 'Invalid IDs' });
        }
        const parsed = upsertSchema.partial().parse(req.body);

        const updated = await storage.updateContentPlatform(contentId, platformId, {
          webUrl:
            parsed.webUrl === undefined
              ? undefined
              : ((parsed.webUrl ?? undefined) as string | undefined),
          seasons: parsed.seasons,
          episodes: parsed.episodes,
        });

        res.json(updated);
      } catch (error) {
        console.error('PATCH /api/admin/content/:contentId/platforms/:platformId failed:', error);
        res.status(400).json({
          message: 'Failed to update content platform',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // DELETE remove a platform from a content item
  app.delete(
    '/api/admin/content/:contentId/platforms/:platformId',
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const contentId = Number(req.params.contentId);
        const platformId = Number(req.params.platformId);
        if (Number.isNaN(contentId) || Number.isNaN(platformId)) {
          return res.status(400).json({ message: 'Invalid IDs' });
        }
        const deleted = await storage.deleteContentPlatform(contentId, platformId);
        res.json(deleted);
      } catch (error) {
        console.error('DELETE /api/admin/content/:contentId/platforms/:platformId failed:', error);
        res.status(400).json({
          message: 'Failed to delete content platform',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}
