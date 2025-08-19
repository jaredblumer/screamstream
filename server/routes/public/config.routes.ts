import type { Express } from 'express';

export function registerConfigRoutes(app: Express) {
  app.get('/api/config', (req, res) => {
    res.json({
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
    });
  });
}
