import { storage } from './storage';
import {
  watchmodeAPI,
  convertWatchmodeTitleToContent,
  popularStreamingPlatforms,
} from './watchmode';
import { Content, InsertContent } from '@shared/schema';
import { incrementWatchmodeRequests } from '@server/storage/usage';

import type { SyncOptions, SyncResult } from '@server/types/content-sync';

class ContentSyncService {
  async syncHorrorContent(options: SyncOptions = {}): Promise<SyncResult> {
    const {
      maxRequests = 50,
      selectedPlatforms = ['Netflix', 'Amazon Prime Video', 'Hulu', 'HBO Max', 'Shudder'],
      minRating = 0.0,
    } = options;

    const result: SyncResult = {
      newMoviesAdded: 0,
      moviesValidated: 0,
      moviesRemoved: 0,
      requestsUsed: 0,
      errors: [],
      summary: '',
      titlesProcessed: [],
      searchStats: {
        totalTitlesFound: 0,
        pagesSearched: 0,
        duplicatesSkipped: 0,
        filteredOut: 0,
      },
    };

    try {
      // Sync mode: fetch new content
      const newContent = await this.fetchHorrorContent(
        selectedPlatforms,
        minRating,
        maxRequests,
        result
      );

      for (const content of newContent) {
        try {
          const existing = await this.findExistingContent(content.title, content.year);
          if (!existing) {
            await storage.createContent(content);
            result.newMoviesAdded++;
          }
        } catch (error) {
          result.errors.push(`Failed to add ${content.title}: ${error}`);
        }
      }
      result.summary = this.generateSummary(result);
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  private async fetchHorrorContent(
    platforms: string[],
    minRating: number,
    maxRequests: number,
    result: SyncResult
  ): Promise<InsertContent[]> {
    const content: InsertContent[] = [];
    const platformMap = popularStreamingPlatforms;
    const selectedPlatformIds = platforms
      .map((platform) => platformMap[platform])
      .filter((id) => id !== undefined);

    try {
      let page = 1;
      let requestsUsed = 0;

      while (requestsUsed <= maxRequests) {
        const searchResult = await watchmodeAPI.searchTitles({
          genres: [11], // Horror genre ID
          source_ids: selectedPlatformIds,
          sort_by: 'popularity_desc',
          page,
          limit: 250,
        });
        console.log(`Page ${page} search result:`, searchResult);
        requestsUsed++;
        await incrementWatchmodeRequests();
        result.searchStats.pagesSearched++;
        result.searchStats.totalTitlesFound += searchResult.titles?.length || 0;

        if (!searchResult.titles || searchResult.titles.length === 0) {
          break;
        }

        // Get details for each title (limited by remaining requests)
        const titlesToProcess = searchResult.titles.slice(
          0,
          Math.min(searchResult.titles.length, maxRequests - requestsUsed)
        );

        for (const titleResult of titlesToProcess) {
          if (requestsUsed >= maxRequests) break;

          try {
            // Check if content already exists BEFORE making expensive API call
            const existingByWatchmodeId = await this.findContentByExternalId(titleResult.id);
            const existingByTitle = await this.findExistingContent(
              titleResult.title,
              titleResult.year
            );

            if (existingByWatchmodeId || existingByTitle) {
              console.log(`Skipping existing content: ${titleResult.title} (${titleResult.year})`);
              result.searchStats.duplicatesSkipped++;
              result.titlesProcessed.push({
                title: titleResult.title,
                year: titleResult.year,
                action: 'skipped_existing',
                reason: 'Already in database',
              });
              continue; // Skip without wasting API credit
            }

            // Only call expensive getTitleDetails for new content
            const titleDetails = await watchmodeAPI.getTitleDetails(titleResult.id);
            requestsUsed++;
            await incrementWatchmodeRequests();

            // Also get platform/source information
            let titleSources: Array<any> = [];
            try {
              titleSources = await watchmodeAPI.getTitleSources(titleResult.id);
              requestsUsed++;
              await incrementWatchmodeRequests();
              console.log(`Found ${titleSources.length} sources for "${titleDetails.title}"`);
            } catch (error) {
              console.log(`Could not fetch sources for "${titleDetails.title}": ${error.message}`);
            }

            // Merge the sources into the title details
            const enrichedTitleDetails = {
              ...titleDetails,
              sources: titleSources,
            };

            const convertedContent = await convertWatchmodeTitleToContent(enrichedTitleDetails);
            content.push(convertedContent);
          } catch (error) {
            console.error(`Failed to get details for title ${titleResult.id}:`, error);
            result.titlesProcessed.push({
              title: titleResult.title,
              year: titleResult.year,
              action: 'error',
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        page++;
      }
    } catch (error) {
      throw new Error(`Failed to fetch horror movies: ${error}`);
    }

    return content;
  }

  private async findExistingContent(title: string, year: number): Promise<Content | null> {
    const existingContent = await storage.getContent();
    return (
      existingContent.find(
        (content) =>
          content.title.toLowerCase() === title.toLowerCase() && Math.abs(content.year - year) <= 1
      ) || null
    );
  }

  /**
   * Find existing content by external IDs (prioritizing watchmode_id for efficiency)
   * This method optimizes API credit usage by checking watchmode_id first (1 credit)
   * before falling back to IMDB/TMDB IDs (2 credits each)
   */
  private async findContentByExternalId(
    watchmodeId?: number,
    imdbId?: string,
    tmdbId?: number
  ): Promise<Content | null> {
    const existingContent = await storage.getContent();

    // First try watchmode_id (most reliable and efficient - 1 credit)
    if (watchmodeId) {
      const found = existingContent.find((content) => content.watchmodeId === watchmodeId);
      if (found) return found;
    }

    // Then try IMDB ID (2 credits)
    if (imdbId) {
      const found = existingContent.find((content) => content.imdbId === imdbId);
      if (found) return found;
    }

    // Finally try TMDB ID (2 credits)
    if (tmdbId) {
      const found = existingContent.find((content) => content.tmdbId === tmdbId);
      if (found) return found;
    }

    return null;
  }

  private generateSummary(result: SyncResult): string {
    const parts = [];

    if (result.newMoviesAdded > 0) {
      parts.push(`${result.newMoviesAdded} new content items added`);
    }

    if (result.moviesValidated > 0) {
      parts.push(`${result.moviesValidated} items validated`);
    }

    if (result.moviesRemoved > 0) {
      parts.push(`${result.moviesRemoved} items removed`);
    }

    if (result.searchStats.duplicatesSkipped > 0) {
      parts.push(`${result.searchStats.duplicatesSkipped} duplicates skipped`);
    }

    if (result.searchStats.filteredOut > 0) {
      parts.push(`${result.searchStats.filteredOut} filtered out`);
    }

    if (result.requestsUsed > 0) {
      parts.push(`${result.requestsUsed} API requests used`);
    }

    if (result.searchStats.pagesSearched > 0) {
      parts.push(`${result.searchStats.pagesSearched} pages searched`);
    }

    if (result.errors.length > 0) {
      parts.push(`${result.errors.length} errors occurred`);
    }

    return parts.length > 0 ? parts.join(', ') + '.' : 'No changes made.';
  }
}

export const contentSyncService = new ContentSyncService();
