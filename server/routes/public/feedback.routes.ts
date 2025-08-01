import type { Express } from "express";
import { storage } from "../../storage";

export function registerFeedbackRoutes(app: Express) {
  app.post("/api/feedback", async (req, res) => {
    try {
      const feedbackData = req.body;
      if (!feedbackData.type || !feedbackData.title || !feedbackData.description) {
        return res.status(400).json({ message: "Missing required fields: type, title, description" });
      }

      const feedback = await storage.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit feedback", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/feedback", async (req, res) => {
    try {
      const { status, type } = req.query;
      const filters: { status?: string; type?: string } = {};

      if (status && typeof status === "string") filters.status = status;
      if (type && typeof type === "string") filters.type = type;

      const feedback = await storage.getFeedback(filters);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid feedback ID" });

      const updates = req.body;
      const feedback = await storage.updateFeedback(id, updates);
      if (!feedback) return res.status(404).json({ message: "Feedback not found" });

      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to update feedback", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
}
