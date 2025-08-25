import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { type Server } from 'http';
import { nanoid } from 'nanoid';

export function log(message: string, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    appType: 'custom',
    server: {
      middlewareMode: true,
      hmr: { server },
    },
  });

  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    try {
      const clientRoot = vite.config.root || path.resolve(process.cwd(), 'client');
      const clientTemplate = path.join(clientRoot, 'index.html');

      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).setHeader('Content-Type', 'text/html').end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), 'dist/public');

  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}. Run "vite build" first.`);
  }

  app.use(express.static(distPath));
  app.use('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
