import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { setupAuth } from './../auth';

import { registerConfigRoutes } from './public/config.routes';
import { registerContentRoutes } from './public/content.routes';
import { registerNewToStreamingRoutes } from './public/newToStreaming.routes';
import { registerWatchlistRoutes } from './public/watchlist.routes';
import { registerReportIssueRoute } from './public/reportIssue';
import { registerPublicSubgenreRoutes } from './public/subgenres.routes';
import { registerPlatformRoutes } from './public/platforms.routes';

import { registerPasswordRoutes } from './auth/password.routes';

import { registerAdminContentRoutes } from './admin/content.routes';
import { registerAdminSyncRoutes } from './admin/sync.routes';
import { registerWatchmodeRoutes } from './admin/watchmode.routes';
import { registerAdminSubgenreRoutes } from './admin/subgenres.routes';
import { registerAdminContentPlatformRoutes } from './admin/content-platform.routes';

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  registerConfigRoutes(app);
  registerContentRoutes(app);
  registerNewToStreamingRoutes(app);
  registerWatchlistRoutes(app);
  registerReportIssueRoute(app);
  registerPublicSubgenreRoutes(app);
  registerPasswordRoutes(app);
  registerPlatformRoutes(app);

  registerAdminContentRoutes(app);
  registerAdminSyncRoutes(app);
  registerWatchmodeRoutes(app);
  registerAdminSubgenreRoutes(app);
  registerAdminContentPlatformRoutes(app);

  return createServer(app);
}
