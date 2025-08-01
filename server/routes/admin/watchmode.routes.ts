import type { Express } from "express";
import { storage } from "../../storage";
import { requireAdmin, requireAuth } from "../../auth";

export function registerWatchmodeRoutes(app: Express) {
  app.put("/api/admin/watchmode/usage", requireAdmin, async (req, res) => {
    try {
      const { requestsUsed } = req.body;
      if (typeof requestsUsed !== "number" || requestsUsed < 0 || requestsUsed > 1000) {
        return res.status(400).json({ message: "Invalid requests count. Must be a number between 0 and 1000." });
      }

      const currentUsage = await storage.getCurrentMonthUsage();
      if (currentUsage) {
        const diff = requestsUsed - currentUsage.watchmodeRequests;
        if (diff !== 0) await storage.incrementWatchmodeRequests(diff);
      } else {
        await storage.incrementWatchmodeRequests(requestsUsed);
      }

      const updatedUsage = await storage.getCurrentMonthUsage();
      const used = updatedUsage?.watchmodeRequests || 0;

      res.json({
        message: "API usage count updated successfully",
        requestsUsed: used,
        requestsRemaining: 1000 - used,
        monthlyLimit: 1000,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update API usage count", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/admin/watchmode/genres", requireAdmin, async (_req, res) => {
    try {
      if (!process.env.WATCHMODE_API_KEY) {
        return res.status(500).json({
          message: "Watchmode API key not configured",
          error: "WATCHMODE_API_KEY environment variable is required",
        });
      }

      const { watchmodeAPI } = await import("../../watchmode.js");
      const genres = await watchmodeAPI.getGenres();

      res.json({
        genres,
        horrorRelated: genres.filter(g =>
          ["horror", "thriller", "scary", "supernatural", "slasher"].some(keyword =>
            g.name.toLowerCase().includes(keyword)
          )
        ),
        currentSubgenres: ["slasher", "psychological", "supernatural", "zombie", "vampire"],
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Watchmode genres", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/watchmode/sources", requireAuth, async (_req, res) => {
    try {
      const { watchmodeAPI } = await import("../../watchmode");
      const sources = await watchmodeAPI.getSources();

      const popularSources = sources.filter(source =>
        source.type === "sub" &&
        source.regions.includes("US") &&
        ["Netflix", "Amazon Prime", "Hulu", "HBO Max", "Disney+", "Apple TV+", "Paramount+", "Peacock", "Shudder"]
          .some(platform => source.name.toLowerCase().includes(platform.toLowerCase()))
      );

      res.json(popularSources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch streaming sources", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/watchmode/status", requireAuth, async (_req, res) => {
    try {
      const currentUsage = await storage.getCurrentMonthUsage();
      const used = currentUsage?.watchmodeRequests || 0;

      res.json({
        requestsUsed: used,
        requestsRemaining: 1000 - used,
        monthlyLimit: 1000,
      });
    } catch (error) {
      res.json({
        requestsUsed: 0,
        requestsRemaining: 1000,
        monthlyLimit: 1000,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
