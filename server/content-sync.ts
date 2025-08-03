import { storage } from './storage';
import {
  watchmodeAPI,
  convertWatchmodeTitleToContent,
  getPopularStreamingPlatforms,
} from './watchmode';
import { Content, InsertContent } from '@shared/schema';

export interface SyncOptions {
  maxRequests?: number;
  selectedPlatforms?: string[];
  minRating?: number;
  validationOnly?: boolean;
}

export interface SyncResult {
  newMoviesAdded: number;
  moviesValidated: number;
  moviesRemoved: number;
  requestsUsed: number;
  errors: string[];
  summary: string;
  titlesProcessed: Array<{
    title: string;
    year: number;
    action: 'added' | 'skipped_existing' | 'filtered_out' | 'error';
    reason?: string;
  }>;
  searchStats: {
    totalTitlesFound: number;
    pagesSearched: number;
    duplicatesSkipped: number;
    filteredOut: number;
  };
}

class ContentSyncService {
  async syncHorrorContent(options: SyncOptions = {}): Promise<SyncResult> {
    console.log('syncHorrorContent with options:', options);
    const {
      maxRequests = 50,
      selectedPlatforms = ['Netflix', 'Amazon Prime Video', 'Hulu', 'HBO Max', 'Shudder'],
      minRating = 0.0,
      validationOnly = false,
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

    // const initialRequestCount = watchmodeAPI.getRequestCount();

    try {
      if (validationOnly) {
        // Validation mode: check existing content
        const validationResult = await this.validateExistingContent(maxRequests);
        result.moviesValidated = validationResult.validated;
        result.moviesRemoved = validationResult.removed;
      } else {
        // Sync mode: fetch new content
        const newContent = await this.fetchNewHorrorMovies(
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
      }

      // result.requestsUsed = watchmodeAPI.getRequestCount() - initialRequestCount;
      result.summary = this.generateSummary(result);
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      // result.requestsUsed = watchmodeAPI.getRequestCount() - initialRequestCount;
    }

    return result;
  }

  private async fetchNewHorrorMovies(
    platforms: string[],
    minRating: number,
    maxRequests: number,
    result: SyncResult
  ): Promise<InsertContent[]> {
    console.log(
      'fetchNewHorrorMovies with platforms:',
      platforms,
      'minRating:',
      minRating,
      'maxRequests:',
      maxRequests
    );
    const content: InsertContent[] = [];
    const platformMap = getPopularStreamingPlatforms();
    console.log('Platform map:', platformMap);
    const selectedPlatformIds = platforms
      .map((platform) => platformMap[platform])
      .filter((id) => id !== undefined);
    console.log('Selected platform IDs:', selectedPlatformIds);

    // if (selectedPlatformIds.length === 0) {
    //   throw new Error("No valid streaming platforms selected");
    // }

    try {
      // Get sources for platform information
      // const sources = await watchmodeAPI.getSources();
      // console.log(`Found ${sources.length} sources`);
      // console.log('Sources:', sources);

      // Search for horror content
      let page = 1;
      let requestsUsed = 1; // for getSources

      while (requestsUsed <= maxRequests && content.length < 100) {
        const searchResult = await watchmodeAPI.searchTitles({
          genres: [11], // Horror genre ID
          source_ids: selectedPlatformIds,
          sort_by: 'popularity_desc',
          page,
          limit: 20,
        });
        console.log(`Page ${page} search result:`, searchResult);

        requestsUsed++;
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

            // Also get platform/source information
            let titleSources: Array<any> = [];
            try {
              titleSources = await watchmodeAPI.getTitleSources(titleResult.id);
              requestsUsed++;
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

            // if (convertedContent.subgenres.some(sg => subgenres.includes(sg))) {
            //   console.log(`✓ Adding ${convertedContent.type}: ${convertedContent.title} (${convertedContent.year}) - Poster: ${convertedContent.posterUrl.includes('artworks.thetvdb.com') ? 'TVDB' : 'Watchmode'}`);
            //   content.push(convertedContent);
            //   result.titlesProcessed.push({
            //     title: convertedContent.title,
            //     year: convertedContent.year,
            //     action: 'added',
            //     reason: `Rating: ${convertedContent.rating}, Subgenres: ${convertedContent.subgenres.join(', ')}`
            //   });
            // } else {
            //   console.log(`Filtered out: ${convertedContent.title} (rating: ${convertedContent.rating}, subgenres: ${convertedContent.subgenres.join(', ')})`);
            //   result.searchStats.filteredOut++;
            //   result.titlesProcessed.push({
            //     title: convertedContent.title,
            //     year: convertedContent.year,
            //     action: 'filtered_out',
            //     reason: `Subgenres: ${convertedContent.subgenres.join(', ')} not in [${subgenres.join(', ')}]`
            //   });
            // }

            // Small delay to respect API rate limits
            await new Promise((resolve) => setTimeout(resolve, 100));
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

  private async validateExistingContent(maxRequests: number): Promise<{
    validated: number;
    removed: number;
  }> {
    let validated = 0;
    let removed = 0;
    let requestsUsed = 0;

    try {
      const existingContent = await storage.getContent();

      for (const content of existingContent) {
        if (requestsUsed >= maxRequests) break;

        try {
          if (content.watchmodeId) {
            // Validate using Watchmode ID (1 credit - most efficient)
            const titleDetails = await watchmodeAPI.getTitleDetails(content.watchmodeId);
            requestsUsed++;
            validated++;
          } else if (content.imdbId) {
            // Validate using IMDB ID (2 credits)
            const searchResults = await watchmodeAPI.searchByImdbId(content.imdbId);
            requestsUsed += 2;

            if (searchResults.length > 0) {
              validated++;
            } else {
              // Content no longer exists in Watchmode
              await storage.deleteContent(content.id);
              removed++;
            }
          } else {
            // Validate using title search
            const searchResults = await watchmodeAPI.searchByName(
              content.title,
              content.type === 'series' ? 'tv' : 'movie'
            );
            requestsUsed++;

            const match = searchResults.find(
              (result) =>
                result.title.toLowerCase() === content.title.toLowerCase() &&
                Math.abs(result.year - content.year) <= 1
            );

            if (match) {
              // Update with external IDs if found (prioritize watchmode_id)
              const updates: Partial<Content> = {};
              if (!content.watchmodeId) updates.watchmodeId = match.id;
              if (match.imdb_id && !content.imdbId) updates.imdbId = match.imdb_id;
              if (match.tmdb_id && !content.tmdbId) updates.tmdbId = match.tmdb_id;

              if (Object.keys(updates).length > 0) {
                await storage.updateContent(content.id, updates);
              }
              validated++;
            }
          }
        } catch (error) {
          console.error(`Failed to validate ${content.title}:`, error);
        }
      }
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }

    return { validated, removed };
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
