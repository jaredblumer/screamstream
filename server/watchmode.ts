import { InsertContent } from '@shared/schema';
import { storage } from './storage';

interface WatchmodeSource {
  id: number;
  name: string;
  type: string;
  logo_100px: string;
  regions: string[];
}

interface WatchmodeTitle {
  id: number;
  title: string;
  original_title: string;
  plot_overview: string;
  type: 'movie' | 'tv_series';
  runtime_minutes: number;
  year: number;
  end_year?: number;
  release_date: string;
  imdb_id: string;
  tmdb_id: number;
  tmdb_type: string;
  genres: number[];
  genre_names: string[];
  user_rating?: number;
  critic_score?: number;
  us_rating?: string;
  poster?: string;
  backdrop?: string;
  original_language?: string;
  networks?: number[];
  network_names?: string[];
  relevance_percentile?: number;
  sources?: Array<{
    source_id: number;
    name: string;
    type: string;
    region: string;
    ios_url?: string;
    android_url?: string;
    web_url?: string;
  }>;
}

interface WatchmodeSearchResult {
  id: number;
  title: string;
  type: 'movie' | 'tv_series';
  year: number;
  imdb_id?: string;
  tmdb_id?: number;
}

// Actual Watchmode releases API response structure (simplified)
interface WatchmodeRelease {
  id: number;
  title: string;
  type: 'movie' | 'tv_series';
  tmdb_id?: number;
  tmdb_type?: string;
  imdb_id?: string;
  season_number?: number;
  poster_url?: string;
  source_release_date: string;
  source_id: number;
  source_name: string;
  is_original: number;
}

class WatchmodeAPI {
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
    // Check database for current month's usage
    // const currentUsage = await storage.getCurrentMonthUsage();
    // const watchmodeRequests = currentUsage?.watchmodeRequests || 0;

    // if (watchmodeRequests >= this.maxRequests) {
    //   throw new Error("Monthly request limit reached for Watchmode API");
    // }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    console.log(`Making Watchmode API request to: ${url.toString()}`);
    url.searchParams.append('apiKey', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    try {
      const response = await fetch(url.toString());
      console.log(`Watchmode API response status: ${response.status}`);

      // Increment database usage tracking after successful request
      // await storage.incrementWatchmodeRequests(1);
      // console.log(`Watchmode API call made. Total requests this month: ${watchmodeRequests + 1}`);

      if (!response.ok) {
        throw new Error(`Watchmode API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Watchmode API request failed: ${error}`);
      throw error;
    }
  }

  async getSources(): Promise<WatchmodeSource[]> {
    console.log('Fetching Watchmode sources...');
    return this.makeRequest<WatchmodeSource[]>('/sources/');
  }

  async getGenres(): Promise<Array<{ id: number; name: string; tmdb_id?: number }>> {
    return this.makeRequest<Array<{ id: number; name: string; tmdb_id?: number }>>('/genres/');
  }

  async searchTitles(params: {
    genres?: number[];
    source_ids?: number[];
    type?: 'movie' | 'tv';
    sort_by?:
      | 'popularity_desc'
      | 'popularity_asc'
      | 'release_date_desc'
      | 'release_date_asc'
      | 'relevance_desc'
      | 'relevance_asc'
      | 'title_desc'
      | 'title_asc';
    page?: number;
    limit?: number;
  }): Promise<{ titles: WatchmodeSearchResult[]; total_results: number; total_pages: number }> {
    console.log('Searching Watchmode titles with params:', params);

    const searchParams: Record<string, string> = {};

    if (params.genres && params.genres.length > 0) {
      searchParams.genres = params.genres.join(',');
    }
    if (params.source_ids && params.source_ids.length > 0) {
      searchParams.source_ids = params.source_ids.join(',');
    }
    if (params.type) {
      searchParams.type = params.type;
    }
    if (params.sort_by) {
      searchParams.sort_by = params.sort_by;
    }
    if (params.page) {
      searchParams.page = params.page.toString();
    }
    if (params.limit) {
      searchParams.limit = params.limit.toString();
    }

    return this.makeRequest<{
      titles: WatchmodeSearchResult[];
      total_results: number;
      total_pages: number;
    }>('/list-titles/', searchParams);
  }

  async getTitleDetails(titleId: number): Promise<WatchmodeTitle> {
    return this.makeRequest<WatchmodeTitle>(`/title/${titleId}/details/`);
  }

  async getTitleSources(titleId: number): Promise<
    Array<{
      source_id: number;
      name: string;
      type: string;
      region: string;
      ios_url?: string;
      android_url?: string;
      web_url?: string;
    }>
  > {
    const result = await this.makeRequest(`/title/${titleId}/sources/`);
    console.log('getTitleSources', result);
    return result || [];
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
    if (type) {
      params.search_type = type;
    }
    const results = await this.makeRequest<{ title_results: WatchmodeSearchResult[] }>(
      '/autocomplete-search/',
      params
    );
    return results.title_results || [];
  }

  async getRecentReleases(
    params: {
      source_ids?: number[];
      change_type?: string; // "new", "free", "subscription", "rent", "buy"
      types?: string; // "movie", "tv", or "movie,tv"
      days_back?: number; // Number of days back to look (default 7, max 30)
      limit?: number; // Max 250
    } = {}
  ): Promise<WatchmodeRelease[]> {
    const searchParams: Record<string, string> = {};

    if (params.source_ids && params.source_ids.length > 0) {
      searchParams.source_ids = params.source_ids.join(',');
    }
    if (params.change_type) {
      searchParams.change_type = params.change_type;
    }
    if (params.types) {
      searchParams.types = params.types;
    }
    if (params.days_back) {
      searchParams.days_back = params.days_back.toString();
    }
    if (params.limit) {
      searchParams.limit = params.limit.toString();
    }

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

export async function convertWatchmodeReleaseToContent(
  release: WatchmodeRelease,
  platformSources: WatchmodeSource[] = []
): Promise<InsertContent> {
  const content = await convertWatchmodeTitleToContent(release.title, platformSources);

  // Add the release date information
  content.sourceReleaseDate = release.source_release_date;

  return content;
}

export async function convertWatchmodeTitleToContent(
  title: WatchmodeTitle
): Promise<InsertContent> {
  const type = title.type === 'tv_series' ? 'series' : 'movie';

  // Extract platform information from sources
  const platforms: string[] = [];
  const platformLinks: string[] = [];

  console.log(`Processing platform data for "${title.title}":`, {
    hasSources: !!title.sources,
    sourcesCount: title.sources?.length || 0,
  });

  // if (title.sources && title.sources.length > 0) {
  //   title.sources.forEach(source => {
  //     const matchingPlatform = platformSources.find(p => p.id === source.source_id);
  //     if (matchingPlatform) {
  //       console.log(`Found platform: ${matchingPlatform.name} (ID: ${source.source_id})`);
  //       if (!platforms.includes(matchingPlatform.name)) {
  //         platforms.push(matchingPlatform.name);
  //         platformLinks.push(source.web_url || '');
  //       }
  //     } else {
  //       console.log(`Unknown platform ID: ${source.source_id}`);
  //     }
  //   });
  // } else {
  //   console.log(`No sources found for "${title.title}"`);
  //   // Fallback: Use generic platform information if available
  //   const popularPlatforms = getPopularStreamingPlatforms();
  //   const platformNames = Object.keys(popularPlatforms);
  //   platforms.push(platformNames[Math.floor(Math.random() * platformNames.length)]);
  // }

  // Get TVDB poster URL using IMDB ID or title search
  let tvdbPosterUrl = '';

  try {
    // Check if TVDB API key is available
    if (process.env.TVDB_API_KEY) {
      const { tvdbAPI } = await import('./tvdb.js');

      // Try to find content in TVDB using IMDB ID first (most accurate)
      if (title.imdb_id) {
        try {
          if (title.type === 'tv_series') {
            const tvdbSeries = await tvdbAPI.getSeriesByRemoteId(title.imdb_id);
            if (tvdbSeries?.image) {
              tvdbPosterUrl = tvdbAPI.getPosterUrl(tvdbSeries.image);
            }
          } else {
            const tvdbMovie = await tvdbAPI.getMovieByRemoteId(title.imdb_id);
            if (tvdbMovie?.image) {
              tvdbPosterUrl = tvdbAPI.getPosterUrl(tvdbMovie.image);
            }
          }
        } catch (remoteIdError) {
          console.log(`IMDB ID search failed for ${title.title}, trying title search...`);
        }
      }

      // If no poster found via IMDB ID, try searching by title
      if (!tvdbPosterUrl) {
        try {
          const searchResults = await tvdbAPI.searchContent(
            title.title,
            title.type === 'tv_series' ? 'series' : 'movie'
          );

          // Only accept matches with exact or close year match (within 1 year)
          console.log(`Searching for year match: "${title.title}" (${title.year})`);

          const match = searchResults.find((result) => {
            const resultYear = parseInt(result.year);
            const titleYear = title.year;

            // Year must match within 1 year range
            const yearMatches = Math.abs(resultYear - titleYear) <= 1;

            // Title must match (exact or contains)
            const titleMatches =
              result.name.toLowerCase() === title.title.toLowerCase() ||
              result.name.toLowerCase().includes(title.title.toLowerCase()) ||
              title.title.toLowerCase().includes(result.name.toLowerCase());

            console.log(
              `  Checking: "${result.name}" (${result.year}) - Year match: ${yearMatches}, Title match: ${titleMatches}`
            );

            return yearMatches && titleMatches;
          });

          if (!match) {
            console.log(`No year-matching TVDB result for "${title.title}" (${title.year})`);
          } else {
            console.log(`Year-matched TVDB result: "${match.name}" (${match.year})`);
          }

          if (match?.image_url) {
            tvdbPosterUrl = match.image_url;
            console.log(
              `TVDB poster found for "${title.title}" -> "${match.name}" (${match.year})`
            );
          } else {
            console.log(`No TVDB poster found for "${title.title}" (${title.year})`);
          }
        } catch (searchError) {
          console.log(`TVDB search failed for ${title.title}:`, searchError.message);
        }
      } else {
        console.log(`TVDB poster found via IMDB ID for "${title.title}"`);
      }
    } else {
      console.log(`TVDB_API_KEY not available, skipping TVDB lookup for ${title.title}`);
    }
  } catch (error) {
    console.warn(`TVDB integration error for ${title.title}:`, error.message);
  }

  // Use TVDB poster if available, otherwise use Watchmode poster, with final fallback to placeholder
  const finalPosterUrl =
    tvdbPosterUrl ||
    getOptimalPosterUrl(title.poster || '', 'medium') ||
    '/posters/default_poster.svg';

  return {
    title: title.title,
    year: title.year,
    rating: title.critic_score ? title.critic_score / 10 : title.user_rating || 6.0,
    criticsRating: title.critic_score ? title.critic_score / 10 : 6.0,
    usersRating: title.user_rating || 0,
    description: title.plot_overview || `A ${type} from ${title.year}`,
    posterUrl: finalPosterUrl,
    // subgenre: null,
    // subgenres: null,
    platforms,
    platformLinks,
    type: type as 'movie' | 'series',
    seasons: type === 'series' ? null : null, // Will be updated if we get this data
    episodes: type === 'series' ? null : null, // Will be updated if we get this data
    watchmodeId: title.id, // Prioritize watchmode_id for efficiency (1 credit vs 2)
    imdbId: title.imdb_id,
    tmdbId: title.tmdb_id,
    // New enhanced fields from Watchmode API
    backdropPath: null, // Not using backdrop URLs
    originalTitle: title.original_title !== title.title ? title.original_title : null,
    releaseDate: title.release_date || null,
    usRating: title.us_rating || null,
    originalLanguage: title.original_language || null,
    runtimeMinutes: title.runtime_minutes || null,
    endYear: title.end_year || null,
    sourceReleaseDate: null, // This will be set when importing from releases API
    // Store full Watchmode response for future use without API calls
    watchmodeData: title as any,
  };
}

export function getPopularStreamingPlatforms(): Record<string, number> {
  return {
    Netflix: 203,
    'Amazon Prime Video': 26,
    Hulu: 157,
    'HBO Max': 384,
    'Disney+': 372,
    'Apple TV+': 371,
    'Paramount+': 389,
    Peacock: 386,
    Shudder: 99,
    Tubi: 283,
  };
}

/**
 * Helper function to get high-quality poster URL from Watchmode
 * Watchmode provides different sizes: w92, w154, w185, w342, w500, w780, original
 */
export function getOptimalPosterUrl(
  posterUrl: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  if (!posterUrl) return '';

  const sizeMap = {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
  };

  // Replace any existing size with our preferred size
  return posterUrl.replace(/w\d+/, sizeMap[size]);
}

/**
 * Helper function to get high-quality backdrop URL from Watchmode
 * Watchmode provides different sizes: w300, w780, w1280, original
 */
export function getOptimalBackdropUrl(
  backdropUrl: string,
  size: 'small' | 'medium' | 'large' = 'large'
): string {
  if (!backdropUrl) return '';

  const sizeMap = {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
  };

  // Replace any existing size with our preferred size
  return backdropUrl.replace(/w\d+/, sizeMap[size]);
}

/**
 * Extract additional metadata from stored Watchmode data without API calls
 */
export function extractMetadataFromWatchmodeData(watchmodeData: any): {
  networks: string[];
  genres: string[];
  relevanceScore: number;
} {
  return {
    networks: watchmodeData?.network_names || [],
    genres: watchmodeData?.genre_names || [],
    relevanceScore: watchmodeData?.relevance_percentile || 0,
  };
}

export const watchmodeAPI = new WatchmodeAPI();
