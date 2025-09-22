import type { Express } from 'express';
import { getNewestStreaming } from '@server/storage/content';

export function registerNewToStreamingRoutes(app: Express) {
  app.get('/api/new-to-streaming', async (req, res) => {
    try {
      const items = await getNewestStreaming(5);
      res.json(items);
    } catch (error) {
      console.error('Error fetching new streaming releases:', error);
      res.status(500).json({
        message: 'Failed to fetch new streaming content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
