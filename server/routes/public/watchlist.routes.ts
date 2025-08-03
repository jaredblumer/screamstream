import type { Express } from 'express';
import { storage } from '../../storage';
import { requireAuth } from '../../auth';

export function registerWatchlistRoutes(app: Express) {
  app.get('/api/watchlist', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const watchlist = await storage.getUserWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch watchlist' });
    }
  });

  app.post('/api/watchlist/:contentId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contentId = parseInt(req.params.contentId);
      if (isNaN(contentId)) return res.status(400).json({ message: 'Invalid content ID' });

      const success = await storage.addToWatchlist(userId, contentId);
      if (success) {
        res.json({ message: 'Added to watchlist successfully' });
      } else {
        res.status(409).json({ message: 'Already in watchlist or error occurred' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to add to watchlist' });
    }
  });

  app.delete('/api/watchlist/:contentId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contentId = parseInt(req.params.contentId);
      if (isNaN(contentId)) return res.status(400).json({ message: 'Invalid content ID' });

      const success = await storage.removeFromWatchlist(userId, contentId);
      if (success) {
        res.json({ message: 'Removed from watchlist successfully' });
      } else {
        res.status(404).json({ message: 'Not found in watchlist' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove from watchlist' });
    }
  });

  app.get('/api/watchlist/:contentId/check', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contentId = parseInt(req.params.contentId);
      if (isNaN(contentId)) return res.status(400).json({ message: 'Invalid content ID' });

      const isInWatchlist = await storage.isInWatchlist(userId, contentId);
      res.json({ isInWatchlist });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check watchlist' });
    }
  });
}
