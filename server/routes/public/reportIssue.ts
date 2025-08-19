import type { Express } from 'express';
import { createIssue } from '../../storage/issues';
import { verifyRecaptcha } from '@server/auth';

export function registerReportIssueRoute(app: Express) {
  app.post('/api/report-issue', async (req, res) => {
    try {
      const { recaptchaToken, ...issueData } = req.body ?? {};

      if (!recaptchaToken) {
        return res.status(400).json({ message: 'Missing reCAPTCHA token' });
      }

      const passed = await verifyRecaptcha(recaptchaToken);
      if (!passed) {
        return res.status(400).json({ message: 'Failed reCAPTCHA verification' });
      }

      if (!issueData?.type || !issueData?.title || !issueData?.description) {
        return res
          .status(400)
          .json({ message: 'Missing required fields: type, title, description' });
      }

      const issue = await createIssue(issueData);
      res.status(201).json(issue);
    } catch (error) {
      console.error('report-issue error', error);
      res.status(500).json({
        message: 'Failed to submit issue',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
