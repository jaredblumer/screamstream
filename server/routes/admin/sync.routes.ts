import type { Express } from "express";
import { requireAdmin } from "../../auth";
import { storage } from "../../storage";

export async function registerAdminSyncRoutes(app: Express) {
  app.post("/api/admin/sync-streaming-releases", requireAdmin, async (req, res) => {
    try {
      console.log("DAILY SYNC: Starting horror releases sync");

      if (!process.env.WATCHMODE_API_KEY) {
        return res.status(500).json({ 
          message: "Watchmode API key not configured",
          error: "WATCHMODE_API_KEY environment variable is required"
        });
      }

      const { watchmodeAPI } = await import("../../watchmode.js");

      const popularPlatforms = {
        'Netflix': 203,
        'Amazon Prime Video': 26,
        'Hulu': 157,
        'HBO Max': 384,
        'Shudder': 99,
        'Tubi': 283
      };

      const releases = await watchmodeAPI.getRecentReleases({
        source_ids: Object.values(popularPlatforms),
        change_type: 'new,subscription',
        types: 'movie,tv',
        days_back: 30,
        limit: 100
      });

      const horrorReleases = [];

      try {
        const horrorSearchResults = await watchmodeAPI.searchTitles({
          genres: [11], // Horror genre ID
          source_ids: Object.values(popularPlatforms),
          sort_by: 'release_date_desc',
          limit: 15
        });

        console.log(`Found ${horrorSearchResults.titles.length} horror titles from Watchmode`);

        for (const title of horrorSearchResults.titles.slice(0, 8)) {
          try {
            const fullTitleDetails = await watchmodeAPI.getTitleDetails(title.id);
            const genres = fullTitleDetails.genre_names || [];

            let availablePlatforms = ['Various Platforms'];
            if (fullTitleDetails.sources?.length > 0) {
              const streamingPlatforms = fullTitleDetails.sources
                .filter(source => 
                  source.type === 'subscription' || 
                  source.type === 'free' || 
                  source.type === 'subscription_with_ads'
                )
                .map(source => source.name)
                .filter((name, index, arr) => arr.indexOf(name) === index)
                .slice(0, 3);

              if (streamingPlatforms.length > 0) {
                availablePlatforms = streamingPlatforms;
              }
            }

            const detailedRelease = {
              id: title.id,
              title: fullTitleDetails.title,
              type: fullTitleDetails.type,
              imdb_id: fullTitleDetails.imdb_id,
              tmdb_id: fullTitleDetails.tmdb_id,
              poster_url: fullTitleDetails.poster || `https://cdn.watchmode.com/posters/${title.id.toString().padStart(8, '0')}_poster_w185.jpg`,
              source_release_date: fullTitleDetails.release_date || new Date().toISOString().split('T')[0],
              source_id: 203,
              source_name: availablePlatforms[0],
              is_original: 0,
              plot_overview: fullTitleDetails.plot_overview,
              user_rating: fullTitleDetails.user_rating,
              critic_score: fullTitleDetails.critic_score,
              genre_names: fullTitleDetails.genre_names,
              year: fullTitleDetails.year,
              runtime_minutes: fullTitleDetails.runtime_minutes,
              us_rating: fullTitleDetails.us_rating,
              backdrop: fullTitleDetails.backdrop,
              available_platforms: availablePlatforms
            };

            horrorReleases.push(detailedRelease);
          } catch {}
        }
      } catch {}

      const shudderReleases = releases.filter(release => release.source_name === 'Shudder');
      horrorReleases.push(...shudderReleases);

      const recentWithImdb = releases.filter(r => r.imdb_id && r.source_name !== 'Shudder').slice(0, 5);
      const { tvdbAPI } = await import("../../tvdb.js");

      for (const release of recentWithImdb) {
        try {
          let hasHorrorGenre = false;

          if (release.type === 'tv_series') {
            const tvdbSeries = await tvdbAPI.getSeriesByRemoteId(release.imdb_id);
            hasHorrorGenre = tvdbSeries?.genres?.some(g => ['Horror', 'Thriller', 'Mystery', 'Suspense'].includes(g.name));
            if (hasHorrorGenre) horrorReleases.push(release);
          } else {
            const tvdbMovie = await tvdbAPI.getMovieByRemoteId(release.imdb_id);
            hasHorrorGenre = tvdbMovie?.genres?.some(g => ['Horror', 'Thriller', 'Mystery', 'Suspense'].includes(g.name));
            if (hasHorrorGenre) horrorReleases.push(release);
          }
        } catch {}
      }

      const newContent = horrorReleases.slice(0, 15).map((release, index) => {
        const type = release.type === "tv_series" ? "series" : "movie";

        return {
          id: index + 1000,
          title: release.title,
          year: release.year || new Date(release.source_release_date).getFullYear(),
          rating: release.critic_score ? release.critic_score / 10 : (release.user_rating || 6.5),
          criticsRating: release.critic_score ? release.critic_score / 10 : 6.5,
          usersRating: release.user_rating || 6.5,
          description: release.plot_overview || `A ${type} available on streaming platforms${release.genre_names ? ` - Genres: ${release.genre_names.join(', ')}` : ''}`,
          posterUrl: release.poster_url || '/posters/default_poster.svg',
          // subgenre,
          // subgenres: [subgenre],
          platforms: release.available_platforms || [release.source_name],
          platformLinks: [],
          type,
          seasons: null,
          episodes: null,
          sourceReleaseDate: release.source_release_date,
          runtimeMinutes: release.runtime_minutes || 0,
          usRating: release.us_rating || '',
          backdropUrl: release.backdrop || '',
          originalTitle: release.title,
          releaseDate: release.source_release_date,
          originalLanguage: 'en',
          endYear: null,
          watchmodeData: release,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      const savedContent = [];
      for (const content of newContent) {
        try {
          const existingContent = await storage.getContent();
          const isDuplicate = existingContent.some(existing => 
            existing.title.toLowerCase().trim() === content.title.toLowerCase().trim() && 
            existing.year === content.year
          );

          if (!isDuplicate) {
            const { id, ...contentWithoutId } = content;
            const savedItem = await storage.createContent(contentWithoutId);
            savedContent.push(savedItem);
          } else {
            const existing = existingContent.find(e => 
              e.title.toLowerCase() === content.title.toLowerCase() && 
              e.year === content.year
            );
            if (existing) savedContent.push(existing);
          }
        } catch {
          savedContent.push(content);
        }
      }

      const actualNewItems = savedContent.filter(item => typeof item.id === 'number' && item.id > 0).length;
      const duplicatesSkipped = newContent.length - actualNewItems;

      const summary = {
        newTitlesAdded: actualNewItems,
        duplicatesSkipped,
        totalProcessed: newContent.length,
        apiCallsUsed: watchmodeAPI.getRequestCount(),
        timestamp: new Date().toISOString()
      };

      console.log(`SYNC COMPLETE: Added ${summary.newTitlesAdded} new titles, skipped ${summary.duplicatesSkipped} duplicates`);
      res.json(summary);
    } catch (error) {
      console.error("Error syncing streaming releases:", error);
      res.status(500).json({ 
        message: "Failed to sync streaming releases", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/admin/sync-posters", requireAdmin, async (_req, res) => {
    try {
      console.log("Starting bulk poster sync...");

      const { tvdbAPI } = await import("../../tvdb.js");
      const existingContent = await storage.getContent();
      const defaultPosterUrl = "/posters/default_poster.svg";

      const itemsMissingPosters = existingContent.filter(item =>
        !item.posterUrl || item.posterUrl === defaultPosterUrl
      );

      let updatedCount = 0;
      let skippedCount = 0;

      for (const item of itemsMissingPosters) {
        const variations = [
          item.title,
          `${item.title} (${item.year})`,
          item.originalTitle,
          `${item.originalTitle} (${item.year})`,
        ].filter(Boolean);

        let matchFound = false;

        for (const title of variations) {
          try {
            const searchResults = await tvdbAPI.search(title);
            const filteredResults = searchResults?.filter(result =>
              result.image_url &&
              (
                result.name?.toLowerCase() === item.title.toLowerCase() ||
                result.name?.toLowerCase() === item.originalTitle?.toLowerCase()
              )
            );

            if (filteredResults && filteredResults.length > 0) {
              const posterUrl = filteredResults[0].image_url;

              await storage.updateContent(item.id, { posterUrl });
              updatedCount++;
              matchFound = true;
              break;
            }
          } catch (searchError) {
            console.warn(`Search error for ${item.title}:`, searchError);
          }
        }

        if (!matchFound) {
          skippedCount++;
        }
      }

      res.json({
        message: "Bulk poster sync completed",
        postersUpdated: updatedCount,
        itemsSkipped: skippedCount,
        totalProcessed: updatedCount + skippedCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in bulk poster sync:", error);
      res.status(500).json({
        message: "Failed to sync posters",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
