import type { Express } from 'express';
import { storage } from '../../storage';

export function registerReportIssueRoute(app: Express) {
  app.post('/api/report-issue', async (req, res) => {
    console.log('[report-issue] received request', req.body);
    try {
      const issueData = req.body;
      if (!issueData.type || !issueData.title || !issueData.description) {
        return res
          .status(400)
          .json({ message: 'Missing required fields: type, title, description' });
      }

      const issue = await storage.createIssue(issueData);
      console.log('[report-issue] issue created', issue);
      res.status(201).json(issue);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to submit issue',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
