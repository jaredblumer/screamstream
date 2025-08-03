import type { Express } from 'express';
import { requireAdmin } from '../../auth';
import { NewToStreamingSyncService } from '@server/services/new-to-streaming-sync.service';

export async function registerAdminSyncRoutes(app: Express) {
  app.post('/api/admin/sync-new-to-streaming', requireAdmin, async (_req, res) => {
    try {
      console.log('DAILY SYNC: Starting horror releases sync');

      if (!process.env.WATCHMODE_API_KEY) {
        return res.status(500).json({
          message: 'Watchmode API key not configured',
          error: 'WATCHMODE_API_KEY environment variable is required',
        });
      }

      const syncService = new NewToStreamingSyncService();
      const result = await syncService.sync();

      console.log(
        `SYNC COMPLETE: Added ${result.newTitlesAdded} new titles, skipped ${result.duplicatesSkipped} duplicates`
      );

      res.json(result);
    } catch (error) {
      console.error('Error syncing streaming releases:', error);
      res.status(500).json({
        message: 'Failed to sync streaming releases',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
