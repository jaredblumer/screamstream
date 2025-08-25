import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

function apiLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api')) return next();

    const start = Date.now();
    let captured: unknown;

    const originalJson = res.json.bind(res);
    res.json = ((body: any, ...args: any[]) => {
      captured = body;
      return originalJson(body, ...args);
    }) as Response['json'];

    res.on('finish', () => {
      const ms = Date.now() - start;
      let line = `${req.method} ${req.path} ${res.statusCode} in ${ms}ms`;
      if (captured !== undefined) {
        try {
          const snip = JSON.stringify(captured);
          line += ` :: ${snip.length > 80 ? snip.slice(0, 79) + '…' : snip}`;
        } catch {
          // ignore stringify errors
        }
      }
      log(line);
    });

    next();
  };
}

export async function createApp() {
  const app = express();

  // basics
  app.set('trust proxy', true);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // api-only logger
  app.use(apiLogger());

  // routes (register returns the underlying http.Server if you need websockets)
  const server = await registerRoutes(app);

  // error handler (no throw after sending the response)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = Number(err?.status || err?.statusCode) || 500;
    const message = err?.message || 'Internal Server Error';
    try {
      log(`ERROR ${status}: ${message}`);
      if (process.env.NODE_ENV !== 'production' && err?.stack) {
        log(err.stack);
      }
    } catch {}
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // dev vs prod assets
  if (app.get('env') === 'development') {
    await setupVite(app, server); // Vite middleware in dev only
  } else {
    serveStatic(app); // serve /dist in prod
  }

  return { app, server };
}

// Only start the listener when executed directly (not when imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const { server } = await createApp();

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    server.listen({ port, host }, () => {
      log(`serving on http://${host}:${port}`);
    });

    // graceful shutdown
    const shutdown = (signal: string) => () => {
      log(`received ${signal}, shutting down…`);
      server.close(() => {
        log('server closed');
        process.exit(0);
      });
      // force-exit if something hangs
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on('SIGINT', shutdown('SIGINT'));
    process.on('SIGTERM', shutdown('SIGTERM'));
  })();
}
