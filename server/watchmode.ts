// Export API client
import { WatchmodeAPI } from '@server/services/watchmode-api';
export { WatchmodeAPI };
export const watchmodeAPI = new WatchmodeAPI();

// Export converters
export {
  convertWatchmodeTitleToContent,
  convertWatchmodeReleaseToContent,
} from '@server/converters/watchmode-content';

// Export helpers
export {
  getOptimalPosterUrl,
  getOptimalBackdropUrl,
  extractMetadataFromWatchmodeData,
} from '@server/utils/watchmode-helpers';

// Export constants
export { popularStreamingPlatforms } from '@server/constants/platforms';

// Export types
export * from '@server/types/watchmode';
