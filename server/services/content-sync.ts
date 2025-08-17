import { getContent, createContent } from '@server/storage/content';
import { incrementWatchmodeRequests, getCurrentMonthUsage } from '@server/storage/usage';
import { createContentPlatform } from '@server/storage/content-platforms';
import {
  watchmodeAPI,
  convertWatchmodeTitleToContent,
  popularStreamingPlatforms,
} from '@server/watchmode';
import { Content, InsertContent, InsertContentPlatform } from '@shared/schema';

import { getOrCreatePlatformByWatchmodeId } from '@server/storage/platforms';

import type { SyncOptions, SyncResult } from '@server/types/content-sync';

class ContentSyncService {
  async syncHorrorContent(options: SyncOptions = {}): Promise<SyncResult> {
    const {
      titlesToSyncCount = 25,
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
      const usage = await getCurrentMonthUsage();
      if (!usage) {
        result.errors.push('Unable to determine API usage');
        return result;
      }

      const requestsRemaining = 1000 - usage.watchmodeRequests;
      const maxTitlesAllowed = Math.floor(requestsRemaining / 2);

      if (maxTitlesAllowed <= 0) {
        result.errors.push('API request limit reached for the month.');
        return result;
      }

      const titlesToFetch = Math.min(titlesToSyncCount, maxTitlesAllowed);

      const newContent = await this.fetchHorrorContent(
        selectedPlatforms,
        minRating,
        titlesToFetch,
        result
      );

      for (const { content, platforms } of newContent) {
        try {
          const existing = await this.findExistingContent(content.title, content.year);
          if (!existing) {
            const createdContent = await createContent(content);
            for (const platform of platforms) {
              await createContentPlatform({
                ...platform,
                contentId: createdContent.id,
              });
            }
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
    titlesToSync: number,
    result: SyncResult
  ): Promise<
    Array<{
      content: InsertContent;
      platforms: Omit<InsertContentPlatform, 'contentId'>[];
    }>
  > {
    const content: Array<{
      content: InsertContent;
      platforms: Omit<InsertContentPlatform, 'contentId'>[];
    }> = [];
    const platformMap = popularStreamingPlatforms;
    const selectedPlatformIds = platforms
      .map((platform) => platformMap[platform])
      .filter((id) => id !== undefined);

    let page = 1;
    let requestsUsed = 0;

    while (content.length < titlesToSync) {
      const searchResult = await watchmodeAPI.searchTitles({
        genres: [11],
        source_ids: selectedPlatformIds,
        minimum_rating: minRating,
        sort_by: 'popularity_desc',
        page,
        limit: 250,
      });

      requestsUsed++;
      await incrementWatchmodeRequests();
      result.searchStats.pagesSearched++;
      result.searchStats.totalTitlesFound += searchResult.titles?.length || 0;

      if (!searchResult.titles || searchResult.titles.length === 0) break;

      for (const titleResult of searchResult.titles) {
        if (content.length >= titlesToSync) break;

        const existingByWatchmodeId = await this.findContentByWatchmodeId(titleResult.id);
        if (existingByWatchmodeId) {
          result.searchStats.duplicatesSkipped++;
          result.titlesProcessed.push({
            title: titleResult.title,
            year: titleResult.year,
            action: 'skipped_existing',
            reason: 'Already in database',
          });
          continue;
        }

        try {
          const titleDetails = await watchmodeAPI.getTitleDetails(titleResult.id);
          requestsUsed++;
          await incrementWatchmodeRequests();

          let titleSources: Array<any> = [];
          try {
            titleSources = await watchmodeAPI.getTitleSources(titleResult.id);
            requestsUsed++;
            await incrementWatchmodeRequests();
          } catch (error) {
            console.log(`Could not fetch sources for "${titleDetails.title}": ${error.message}`);
          }

          const convertedContent = await convertWatchmodeTitleToContent(titleDetails);

          const popularPlatformIds = new Set(Object.values(popularStreamingPlatforms));
          const filteredSources = titleSources.filter(
            (source) =>
              source.type === 'sub' &&
              source.region === 'US' &&
              source.web_url &&
              popularPlatformIds.has(source.source_id)
          );

          const contentPlatforms: Omit<InsertContentPlatform, 'contentId'>[] = [];

          for (const source of filteredSources) {
            const platform = await getOrCreatePlatformByWatchmodeId(source.source_id);
            contentPlatforms.push({
              platformId: platform.id,
              webUrl: source.web_url,
              format: source.format,
              seasons: source.seasons,
              episodes: source.episodes,
            });
          }

          if (convertedContent.genres?.includes(33)) {
            convertedContent.hidden = true;
          }

          content.push({ content: convertedContent, platforms: contentPlatforms });

          result.titlesProcessed.push({
            title: titleResult.title,
            year: titleResult.year,
            action: 'added',
          });
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

    result.requestsUsed += requestsUsed;
    return content;
  }

  private async findExistingContent(title: string, year: number): Promise<Content | null> {
    const existingContent = await getContent();
    return (
      existingContent.find(
        (content) =>
          content.title.toLowerCase() === title.toLowerCase() && Math.abs(content.year - year) <= 1
      ) || null
    );
  }

  private async findContentByWatchmodeId(watchmodeId?: number): Promise<Content | null> {
    const existingContent = await getContent({ includeHidden: true, includeInactive: true });
    if (watchmodeId) {
      const found = existingContent.find((content) => content.watchmodeId === watchmodeId);
      if (found) return found;
    }
    return null;
  }

  private generateSummary(result: SyncResult): string {
    const parts = [];

    if (result.newMoviesAdded > 0) parts.push(`${result.newMoviesAdded} new content items added`);
    if (result.moviesValidated > 0) parts.push(`${result.moviesValidated} items validated`);
    if (result.moviesRemoved > 0) parts.push(`${result.moviesRemoved} items removed`);
    if (result.searchStats.duplicatesSkipped > 0)
      parts.push(`${result.searchStats.duplicatesSkipped} duplicates skipped`);
    if (result.searchStats.filteredOut > 0)
      parts.push(`${result.searchStats.filteredOut} filtered out`);
    if (result.requestsUsed > 0) parts.push(`${result.requestsUsed} API requests used`);
    if (result.searchStats.pagesSearched > 0)
      parts.push(`${result.searchStats.pagesSearched} pages searched`);
    if (result.errors.length > 0) parts.push(`${result.errors.length} errors occurred`);

    return parts.length > 0 ? parts.join(', ') + '.' : 'No changes made.';
  }
}

export const contentSyncService = new ContentSyncService();
