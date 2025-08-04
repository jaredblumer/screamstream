export interface SyncOptions {
  titlesToSyncCount?: number;
  selectedPlatforms?: string[];
  minRating?: number;
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
