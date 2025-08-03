export interface WatchmodeSource {
  id: number;
  name: string;
  type: string;
  logo_100px: string;
  regions: string[];
}

export interface WatchmodeTitle {
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

export interface WatchmodeSearchResult {
  id: number;
  title: string;
  type: 'movie' | 'tv_series';
  year: number;
  imdb_id?: string;
  tmdb_id?: number;
}

// Actual Watchmode releases API response structure (simplified)
export interface WatchmodeRelease {
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
