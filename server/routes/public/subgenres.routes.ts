import type { Express } from "express";
import { storage } from "../../storage";

export function registerPublicSubgenreRoutes(app: Express) {
  app.get("/api/subgenres", async (_req, res) => {
    try {
      const subgenres = await storage.getSubgenres(true); // Active only
      res.json(subgenres);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subgenres", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
}
