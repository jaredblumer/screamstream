import { getContent, createContent } from '@server/storage/content';
import { createContentPlatform } from '@server/storage/content-platforms';
import { getOrCreatePlatformByWatchmodeId } from '@server/storage/platforms';
import { incrementWatchmodeRequests, getCurrentMonthUsage } from '@server/storage/usage';

import {
  watchmodeAPI,
  convertWatchmodeTitleToContent,
  popularStreamingPlatforms,
} from '@server/watchmode';

import type { InsertContent, InsertContentPlatform } from '@shared/schema';

interface SyncSummary {
  newTitlesAdded: number;
  duplicatesSkipped: number;
  totalProcessed: number;
  apiCallsUsed: number;
  timestamp: string;
}

type QueuedItem = {
  content: InsertContent;
  platforms: Omit<InsertContentPlatform, 'contentId'>[];
};

export class NewToStreamingSyncService {
  async sync(): Promise<SyncSummary> {
    // Respect monthly request cap (same pattern as ContentSyncService)
    const usage = await getCurrentMonthUsage();
    if (!usage || usage.watchmodeRequests >= 1000) {
      return {
        newTitlesAdded: 0,
        duplicatesSkipped: 0,
        totalProcessed: 0,
        apiCallsUsed: 0,
        timestamp: new Date().toISOString(),
      };
    }

    const queue: QueuedItem[] = [];
    let requestsUsed = 0;

    const selectedPlatformIds = Object.values(popularStreamingPlatforms);
    const isPopularUSSub = (s: any) =>
      s &&
      s.region === 'US' &&
      s.web_url &&
      s.type === 'sub' &&
      selectedPlatformIds.includes(s.source_id);

    // Helper: fetch details + sources, convert to InsertContent + platform rows
    const loadDetailsAndPlatforms = async (watchmodeId: number): Promise<QueuedItem | null> => {
      try {
        const details = await watchmodeAPI.getTitleDetails(watchmodeId);
        requestsUsed++;
        await incrementWatchmodeRequests();

        let sources: any[] = [];
        try {
          sources = await watchmodeAPI.getTitleSources(watchmodeId);
          requestsUsed++;
          await incrementWatchmodeRequests();
        } catch {
          // okay: no sources
        }

        const converted = await convertWatchmodeTitleToContent(details);

        // Hide anime (33) to mirror your other service’s behavior
        if (converted.genres?.includes(33)) converted.hidden = true;

        // Ensure we have a sourceReleaseDate for “new to streaming” context
        converted.sourceReleaseDate =
          converted.sourceReleaseDate ||
          details.release_date ||
          new Date().toISOString().split('T')[0];

        const filtered = sources.filter(isPopularUSSub);
        const platformRows: Omit<InsertContentPlatform, 'contentId'>[] = [];

        for (const src of filtered) {
          const platform = await getOrCreatePlatformByWatchmodeId(src.source_id);
          platformRows.push({
            platformId: platform.id,
            webUrl: src.web_url,
            seasons: src.seasons,
            episodes: src.episodes,
          });
        }

        return { content: converted, platforms: platformRows };
      } catch {
        return null;
      }
    };

    // Step 1: Watchmode horror search (recent by release date)
    try {
      const horrorSearch = await watchmodeAPI.searchTitles({
        genres: [11],
        source_ids: selectedPlatformIds,
        sort_by: 'release_date_desc',
        limit: 15,
      });
      requestsUsed++;
      await incrementWatchmodeRequests();

      const top = (horrorSearch.titles || []).slice(0, 8);
      for (const t of top) {
        const item = await loadDetailsAndPlatforms(t.id);
        if (item) queue.push(item);
      }
    } catch {
      // continue
    }

    // Step 2: Watchmode recent releases (new/changed to subscription) for last 30 days
    try {
      const releases = await watchmodeAPI.getRecentReleases({
        source_ids: selectedPlatformIds,
        change_type: 'new,subscription',
        types: 'movie,tv',
        days_back: 30,
        limit: 100,
      });
      requestsUsed++;
      await incrementWatchmodeRequests();

      // Filter using Watchmode genres (no TVDB calls)
      for (const r of releases || []) {
        try {
          const item = await loadDetailsAndPlatforms(r.id);
          if (!item) continue;

          // Horror = Watchmode genre id 11
          const isHorror = Array.isArray(item.content.genres) && item.content.genres.includes(11);
          if (!isHorror) continue;

          queue.push(item);
        } catch {
          // ignore individual failures
        }
      }
    } catch {
      // ignore
    }

    // De-dupe queued items by IDs ONLY: watchmodeId -> imdbId -> tmdbId
    // (No title/year fallback)
    const unique: QueuedItem[] = [];
    const seenWM = new Set<number>();
    const seenIMDB = new Set<string>();
    const seenTMDB = new Set<number>();

    for (const q of queue) {
      const wm = q.content.watchmodeId ?? undefined;
      const imdb = q.content.imdbId ?? undefined;
      const tmdb = q.content.tmdbId ?? undefined;

      const already =
        (wm && seenWM.has(wm)) || (imdb && seenIMDB.has(imdb)) || (tmdb && seenTMDB.has(tmdb));

      if (already) continue;

      if (wm) seenWM.add(wm);
      if (imdb) seenIMDB.add(imdb);
      if (tmdb) seenTMDB.add(tmdb);
      unique.push(q);
    }

    // Build quick lookup sets from existing DB to skip duplicates fast
    const existing = await getContent({ includeHidden: true, includeInactive: true });
    const existingWM = new Set<number>(
      existing.map((e) => e.watchmodeId).filter(Boolean) as number[]
    );
    const existingIMDB = new Set<string>(existing.map((e) => e.imdbId).filter(Boolean) as string[]);
    const existingTMDB = new Set<number>(existing.map((e) => e.tmdbId).filter(Boolean) as number[]);

    const isDuplicateInDB = (c: InsertContent) =>
      (!!c.watchmodeId && existingWM.has(c.watchmodeId)) ||
      (!!c.imdbId && existingIMDB.has(c.imdbId)) ||
      (!!c.tmdbId && existingTMDB.has(c.tmdbId));

    // Save up to 15 items; add platform join rows
    let newTitlesAdded = 0;
    let duplicatesSkipped = 0;
    let totalProcessed = 0;

    for (const { content, platforms } of unique.slice(0, 15)) {
      totalProcessed++;

      if (isDuplicateInDB(content)) {
        duplicatesSkipped++;
        continue;
      }

      try {
        const created = await createContent(content);
        for (const p of platforms) {
          await createContentPlatform({ ...p, contentId: created.id });
        }
        newTitlesAdded++;
      } catch {
        // skip on error
      }
    }

    return {
      newTitlesAdded,
      duplicatesSkipped,
      totalProcessed,
      apiCallsUsed: requestsUsed,
      timestamp: new Date().toISOString(),
    };
  }
}
