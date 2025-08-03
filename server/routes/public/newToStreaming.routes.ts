import type { Express } from 'express';
import { storage } from '../../storage';

export function registerNewToStreamingRoutes(app: Express) {
  app.get('/api/new-to-streaming', async (req, res) => {
    try {
      console.log('NEW TO STREAMING: Fetching from database by recent release dates');

      // Get content released in the last 30 days, sorted by release date
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const allContent = await storage.getContent();

      const recentReleases = allContent
        .filter(
          (content) => content.sourceReleaseDate && content.sourceReleaseDate >= thirtyDaysAgo
        )
        .sort(
          (a, b) =>
            new Date(b.sourceReleaseDate!).getTime() - new Date(a.sourceReleaseDate!).getTime()
        )
        .slice(0, 20);

      console.log(`Found ${recentReleases.length} recent horror releases in database`);
      res.json(recentReleases);
    } catch (error) {
      console.error('Error fetching new streaming releases:', error);
      res.status(500).json({
        message: 'Failed to fetch new streaming content',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
