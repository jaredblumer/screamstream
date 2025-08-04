import {
  WatchmodeSource,
  WatchmodeSearchResult,
  WatchmodeRelease,
  WatchmodeTitle,
} from '@server/types/watchmode';
import { storage } from '@server/storage';

export class WatchmodeAPI {
  private readonly baseUrl = 'https://api.watchmode.com/v1';
  private readonly apiKey: string;
  private requestCount = 0;
  private readonly maxRequests = 1000;

  constructor() {
    const apiKey = process.env.WATCHMODE_API_KEY;
    if (!apiKey) {
      throw new Error('WATCHMODE_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const currentUsage = await storage.getCurrentMonthUsage();
    const watchmodeRequests = currentUsage?.watchmodeRequests || 0;

    if (watchmodeRequests >= this.maxRequests) {
      throw new Error('Monthly request limit reached for Watchmode API');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('apiKey', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Watchmode API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getSources(): Promise<WatchmodeSource[]> {
    return this.makeRequest<WatchmodeSource[]>('/sources/');
  }

  async getGenres(): Promise<Array<{ id: number; name: string; tmdb_id?: number }>> {
    return this.makeRequest<Array<{ id: number; name: string; tmdb_id?: number }>>('/genres/');
  }

  async searchTitles(params: {
    genres?: number[];
    source_ids?: number[];
    type?: 'movie' | 'tv';
    minimum_rating?: number;
    sort_by?: string;
    page?: number;
    limit?: number;
  }): Promise<{ titles: WatchmodeSearchResult[]; total_results: number; total_pages: number }> {
    const searchParams: Record<string, string> = {};
    if (params.genres) searchParams.genres = params.genres.join(',');
    if (params.source_ids) searchParams.source_ids = params.source_ids.join(',');
    if (params.type) searchParams.type = params.type;
    if (params.minimum_rating) searchParams.critic_score_low = params.minimum_rating.toString();
    if (params.minimum_rating) searchParams.user_rating_low = params.minimum_rating.toString();
    if (params.sort_by) searchParams.sort_by = params.sort_by;
    if (params.page) searchParams.page = params.page.toString();
    if (params.limit) searchParams.limit = params.limit.toString();

    return this.makeRequest('/list-titles/', searchParams);
  }

  async getTitleDetails(titleId: number): Promise<WatchmodeTitle> {
    return this.makeRequest(`/title/${titleId}/details/`);
  }

  async getTitleSources(titleId: number): Promise<WatchmodeSource[]> {
    return this.makeRequest(`/title/${titleId}/sources/`);
  }

  async searchByImdbId(imdbId: string): Promise<WatchmodeSearchResult[]> {
    const params = { imdb_id: imdbId };
    const results = await this.makeRequest<{ title_results: WatchmodeSearchResult[] }>(
      '/autocomplete-search/',
      params
    );
    return results.title_results || [];
  }

  async searchByName(name: string, type?: 'movie' | 'tv'): Promise<WatchmodeSearchResult[]> {
    const params: Record<string, string> = { search_value: name };
    if (type) params.search_type = type;

    const results = await this.makeRequest<{ title_results: WatchmodeSearchResult[] }>(
      '/autocomplete-search/',
      params
    );
    return results.title_results || [];
  }

  async getRecentReleases(
    params: {
      source_ids?: number[];
      change_type?: string;
      types?: string;
      days_back?: number;
      limit?: number;
    } = {}
  ): Promise<WatchmodeRelease[]> {
    const searchParams: Record<string, string> = {};
    if (params.source_ids) searchParams.source_ids = params.source_ids.join(',');
    if (params.change_type) searchParams.change_type = params.change_type;
    if (params.types) searchParams.types = params.types;
    if (params.days_back) searchParams.days_back = params.days_back.toString();
    if (params.limit) searchParams.limit = params.limit.toString();

    const result = await this.makeRequest<{ releases: WatchmodeRelease[] }>(
      '/releases/',
      searchParams
    );
    return result.releases || [];
  }

  getRemainingRequests(): number {
    return this.maxRequests - this.requestCount;
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}
