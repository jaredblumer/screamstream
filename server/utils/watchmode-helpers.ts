/**
 * Returns a high-quality poster URL from Watchmode
 * Watchmode poster sizes: w92, w154, w185, w342, w500, w780, original
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

  return posterUrl.replace(/w\d+/, sizeMap[size]);
}

/**
 * Returns a high-quality backdrop URL from Watchmode
 * Watchmode backdrop sizes: w300, w780, w1280, original
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

  return backdropUrl.replace(/w\d+/, sizeMap[size]);
}

/**
 * Extract additional metadata from a stored Watchmode response
 * This allows reuse without needing another API call.
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
