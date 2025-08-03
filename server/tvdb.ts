import { InsertContent } from '../shared/schema.js';

interface TVDBAuth {
  apikey: string;
  pin?: string; // Only for user-supported keys
}

interface TVDBAuthResponse {
  status: string;
  data: {
    token: string;
  };
}

interface TVDBArtwork {
  id: number;
  image: string; // filename
  thumbnail: string;
  language: string;
  type: number; // artwork type ID
  score: number;
  width: number;
  height: number;
}

interface TVDBMovie {
  id: number;
  name: string;
  slug: string;
  image: string; // poster filename
  status: {
    id: number;
    name: string;
  };
  score: number;
  runtime: number;
  year: string;
  genres: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  overview: string;
  originalCountry: string;
  originalLanguage: string;
  boxOffice: string;
  budget: string;
  releases: Array<{
    country: string;
    date: string;
    detail: string;
  }>;
  remoteIds: Array<{
    id: string;
    type: number;
    sourceName: string;
  }>;
  artworks: TVDBArtwork[];
}

interface TVDBSeries {
  id: number;
  name: string;
  slug: string;
  image: string; // poster filename
  status: {
    id: number;
    name: string;
  };
  score: number;
  year: string;
  genres: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  overview: string;
  originalCountry: string;
  originalLanguage: string;
  airsDays: {
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
  };
  firstAired: string;
  lastAired: string;
  remoteIds: Array<{
    id: string;
    type: number;
    sourceName: string;
  }>;
  artworks: TVDBArtwork[];
}

interface TVDBSearchResult {
  objectID: string;
  aliases: string[];
  country: string;
  id: string;
  image_url: string;
  name: string;
  first_air_time: string;
  overview: string;
  primary_language: string;
  primary_type: string; // "movie" or "series"
  status: string;
  type: string;
  tvdb_id: string;
  year: string;
  slug: string;
  overviews: Record<string, string>;
  translations: Record<string, string>;
  network: string;
  remote_ids: Array<{
    id: string;
    type: number;
    sourceName: string;
  }>;
}

class TVDBAPI {
  private readonly baseUrl = 'https://api4.thetvdb.com/v4';
  private readonly imageBaseUrl = 'https://artworks.thetvdb.com/banners/';
  private readonly apiKey: string;
  private readonly pin?: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private requestCount = 0;

  constructor() {
    const apiKey = process.env.TVDB_API_KEY;
    if (!apiKey) {
      throw new Error('TVDB_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    // PIN is only for user-supported keys, not needed for commercial keys
    this.pin = process.env.TVDB_PIN;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return; // Token is still valid
    }

    await this.authenticate();
  }

  private async authenticate(): Promise<void> {
    try {
      const authData: TVDBAuth = { apikey: this.apiKey };
      if (this.pin) {
        authData.pin = this.pin;
      }

      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });

      if (!response.ok) {
        throw new Error(`TVDB authentication failed: ${response.status} ${response.statusText}`);
      }

      const result: TVDBAuthResponse = await response.json();
      this.token = result.data.token;

      // Token is valid for 1 month, set expiry to 29 days to be safe
      this.tokenExpiry = new Date();
      this.tokenExpiry.setDate(this.tokenExpiry.getDate() + 29);

      console.log('TVDB authentication successful');
    } catch (error) {
      console.error('TVDB authentication error:', error);
      throw new Error(`TVDB authentication failed: ${error}`);
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    await this.ensureAuthenticated();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    this.requestCount++;

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`TVDB API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`TVDB API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async searchContent(query: string, type?: 'movie' | 'series'): Promise<TVDBSearchResult[]> {
    const params: Record<string, string> = {
      query,
    };

    if (type) {
      params.type = type;
    }

    const response = await this.makeRequest<{ data: TVDBSearchResult[] }>('/search', params);
    return response.data || [];
  }

  async getMovieDetails(movieId: number): Promise<TVDBMovie> {
    const response = await this.makeRequest<{ data: TVDBMovie }>(`/movies/${movieId}/extended`);
    return response.data;
  }

  async getSeriesDetails(seriesId: number): Promise<TVDBSeries> {
    const response = await this.makeRequest<{ data: TVDBSeries }>(`/series/${seriesId}/extended`);
    return response.data;
  }

  async getMovieByRemoteId(imdbId: string): Promise<TVDBMovie | null> {
    try {
      const response = await this.makeRequest<{ data: TVDBMovie }>(`/search/remoteid/${imdbId}`);
      return response.data;
    } catch (error) {
      console.error(`Title not found for IMDB ID ${imdbId}:`, error);
      return null;
    }
  }

  async getSeriesByRemoteId(imdbId: string): Promise<TVDBSeries | null> {
    try {
      const response = await this.makeRequest<{ data: TVDBSeries }>(`/search/remoteid/${imdbId}`);
      return response.data;
    } catch (error) {
      console.error(`Series not found for IMDB ID ${imdbId}:`, error);
      return null;
    }
  }

  getImageUrl(filename: string): string {
    if (!filename) return '';
    return `${this.imageBaseUrl}${filename}`;
  }

  getPosterUrl(filename: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    return this.getImageUrl(filename);
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}

export function convertTVDBMovieToContent(movie: TVDBMovie): InsertContent {
  // Map TVDB genres to our horror subgenres
  const horrorGenreMap: Record<string, string> = {
    Horror: 'supernatural',
    Thriller: 'psychological',
    Mystery: 'mystery',
    'Science Fiction': 'sci-fi',
    Drama: 'psychological',
    Action: 'slasher',
    Supernatural: 'supernatural',
    Slasher: 'slasher',
    Zombie: 'zombie',
    Vampire: 'vampire',
    Ghost: 'ghost',
    Monster: 'monster',
  };

  const subgenres = movie.genres
    .map((genre) => horrorGenreMap[genre.name] || genre.name.toLowerCase())
    .filter((subgenre) =>
      [
        'slasher',
        'psychological',
        'supernatural',
        'zombie',
        'vampire',
        'ghost',
        'monster',
        'thriller',
        'mystery',
        'sci-fi',
      ].includes(subgenre)
    );

  const primarySubgenre = subgenres.length > 0 ? subgenres[0] : 'supernatural';

  // Extract IMDB ID if available
  const imdbRemoteId = movie.remoteIds?.find((id) => id.sourceName === 'IMDB')?.id;

  return {
    title: movie.name,
    year: parseInt(movie.year) || new Date().getFullYear(),
    rating: movie.score ? movie.score / 10 : 6.0, // Convert TVDB score to 1-10 scale
    criticsRating: movie.score ? movie.score / 10 : 6.0,
    usersRating: movie.score ? movie.score / 10 : 0,
    description: movie.overview || `A movie from ${movie.year}`,
    posterUrl: tvdbAPI.getPosterUrl(movie.image, 'medium'),
    subgenre: primarySubgenre,
    subgenres: subgenres.length > 0 ? subgenres : [primarySubgenre],
    platforms: [], // TVDB doesn't provide streaming platform info
    platformLinks: [],
    type: 'movie' as const,
    seasons: null,
    episodes: null,
    watchmodeId: null, // No longer using Watchmode
    imdbId: imdbRemoteId || null,
    tmdbId: null, // Could be extracted from remoteIds if needed
    backdropPath: null, // Could use artworks for backdrop if needed
    originalTitle: movie.name, // TVDB doesn't distinguish original vs translated titles clearly
    releaseDate: movie.releases?.[0]?.date || null,
    usRating: null, // TVDB doesn't provide content rating in this format
    originalLanguage: movie.originalLanguage || null,
    runtimeMinutes: movie.runtime || null,
    endYear: null,
    watchmodeData: null, // Store TVDB data instead
  };
}

export function convertTVDBSeriesToContent(series: TVDBSeries): InsertContent {
  // Map TVDB genres to our horror subgenres
  const horrorGenreMap: Record<string, string> = {
    Horror: 'supernatural',
    Thriller: 'psychological',
    Mystery: 'mystery',
    'Science Fiction': 'sci-fi',
    Drama: 'psychological',
    Action: 'slasher',
    Supernatural: 'supernatural',
    Slasher: 'slasher',
    Zombie: 'zombie',
    Vampire: 'vampire',
    Ghost: 'ghost',
    Monster: 'monster',
  };

  const subgenres = series.genres
    .map((genre) => horrorGenreMap[genre.name] || genre.name.toLowerCase())
    .filter((subgenre) =>
      [
        'slasher',
        'psychological',
        'supernatural',
        'zombie',
        'vampire',
        'ghost',
        'monster',
        'thriller',
        'mystery',
        'sci-fi',
      ].includes(subgenre)
    );

  const primarySubgenre = subgenres.length > 0 ? subgenres[0] : 'supernatural';

  // Extract IMDB ID if available
  const imdbRemoteId = series.remoteIds?.find((id) => id.sourceName === 'IMDB')?.id;

  // Calculate end year if series has ended
  const endYear = series.lastAired ? new Date(series.lastAired).getFullYear() : null;

  return {
    title: series.name,
    year: parseInt(series.year) || new Date().getFullYear(),
    rating: series.score ? series.score / 10 : 6.0, // Convert TVDB score to 1-10 scale
    criticsRating: series.score ? series.score / 10 : 6.0,
    usersRating: series.score ? series.score / 10 : 0,
    description: series.overview || `A series from ${series.year}`,
    posterUrl: tvdbAPI.getPosterUrl(series.image, 'medium'),
    subgenre: primarySubgenre,
    subgenres: subgenres.length > 0 ? subgenres : [primarySubgenre],
    platforms: [], // TVDB doesn't provide streaming platform info
    platformLinks: [],
    type: 'series' as const,
    seasons: null, // Could be determined from episodes data if needed
    episodes: null,
    watchmodeId: null, // No longer using Watchmode
    imdbId: imdbRemoteId || null,
    tmdbId: null, // Could be extracted from remoteIds if needed
    backdropPath: null, // Could use artworks for backdrop if needed
    originalTitle: series.name, // TVDB doesn't distinguish original vs translated titles clearly
    releaseDate: series.firstAired || null,
    usRating: null, // TVDB doesn't provide content rating in this format
    originalLanguage: series.originalLanguage || null,
    runtimeMinutes: null, // Series don't have a single runtime
    endYear: endYear,
    watchmodeData: null, // Store TVDB data instead
  };
}

export const tvdbAPI = new TVDBAPI();
