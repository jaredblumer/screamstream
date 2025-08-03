import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { setupAuth } from './../auth';
import { registerConfigRoutes } from './public/config.routes';
import { registerContentRoutes } from './public/content.routes';
import { registerNewToStreamingRoutes } from './public/newToStreaming.routes';
import { registerWatchlistRoutes } from './public/watchlist.routes';
import { registerFeedbackRoutes } from './public/feedback.routes';
import { registerPublicSubgenreRoutes } from './public/subgenres.routes';
import { registerPasswordRoutes } from './auth/password.routes';

import { registerAdminContentRoutes } from './admin/content.routes';
import { registerAdminSyncRoutes } from './admin/sync.routes';
import { registerWatchmodeRoutes } from './admin/watchmode.routes';
import { registerAdminSubgenreRoutes } from './admin/subgenres.routes';
import { registerPlatformImageRoutes } from './admin/platformImages.routes';

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  registerConfigRoutes(app);
  registerContentRoutes(app);
  registerNewToStreamingRoutes(app);
  registerWatchlistRoutes(app);
  registerFeedbackRoutes(app);
  registerPublicSubgenreRoutes(app);
  registerPasswordRoutes(app);

  registerAdminContentRoutes(app);
  registerAdminSyncRoutes(app);
  registerWatchmodeRoutes(app);
  registerAdminSubgenreRoutes(app);
  registerPlatformImageRoutes(app);

  return createServer(app);
}
