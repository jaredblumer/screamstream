import { InsertContent } from '@shared/schema';
import { WatchmodeRelease, WatchmodeTitle } from '@server/types/watchmode';
import { getOptimalPosterUrl } from '@server/utils/watchmode-helpers';
import { calculateAverageRating } from '@server/routes/utils/average-rating';

/**
 * Convert a Watchmode release into InsertContent format
 * Requires title information already loaded or assumes release.title is a WatchmodeTitle
 */
export async function convertWatchmodeReleaseToContent(
  release: WatchmodeRelease
): Promise<InsertContent> {
  const content = await convertWatchmodeTitleToContent(release as unknown as WatchmodeTitle);
  content.sourceReleaseDate = release.source_release_date;
  return content;
}

/**
 * Convert Watchmode title to InsertContent
 */
export async function convertWatchmodeTitleToContent(
  title: WatchmodeTitle
): Promise<InsertContent> {
  const type = title.type === 'tv_series' ? 'series' : 'movie';

  // Optional: integrate TVDB poster lookup
  let tvdbPosterUrl = '';
  try {
    if (process.env.TVDB_API_KEY) {
      const { tvdbAPI } = await import('@server/tvdb');
      if (title.imdb_id) {
        const lookup =
          title.type === 'tv_series'
            ? await tvdbAPI.getSeriesByRemoteId(title.imdb_id)
            : await tvdbAPI.getMovieByRemoteId(title.imdb_id);
        if (lookup?.image) {
          tvdbPosterUrl = tvdbAPI.getPosterUrl(lookup.image);
        }
      }

      if (!tvdbPosterUrl) {
        const searchResults = await tvdbAPI.searchContent(title.title, type);
        const match = searchResults.find((result) => {
          const resultYear = parseInt(result.year);
          const yearMatches = Math.abs(resultYear - title.year) <= 1;
          const titleMatches =
            result.name.toLowerCase() === title.title.toLowerCase() ||
            result.name.toLowerCase().includes(title.title.toLowerCase()) ||
            title.title.toLowerCase().includes(result.name.toLowerCase());
          return yearMatches && titleMatches;
        });
        if (match?.image_url) {
          tvdbPosterUrl = match.image_url;
        }
      }
    }
  } catch (error) {
    console.warn(`TVDB integration error for "${title.title}":`, (error as Error).message);
  }

  const finalPosterUrl =
    tvdbPosterUrl ||
    getOptimalPosterUrl(title.poster || '', 'medium') ||
    '/posters/default_poster.svg';

  return {
    title: title.title,
    year: title.year,
    averageRating: calculateAverageRating(title.critic_score, title.user_rating),
    criticsRating: title.critic_score ? title.critic_score / 10 : null,
    usersRating: title.user_rating || null,
    description: title.plot_overview || `A ${type} from ${title.year}`,
    posterUrl: finalPosterUrl,
    type,
    seasons: null,
    episodes: null,
    watchmodeId: title.id,
    imdbId: title.imdb_id,
    tmdbId: title.tmdb_id,
    backdropPath: null,
    originalTitle: title.original_title !== title.title ? title.original_title : null,
    releaseDate: title.release_date || null,
    usRating: title.us_rating || null,
    originalLanguage: title.original_language || null,
    runtimeMinutes: title.runtime_minutes || null,
    endYear: title.end_year || null,
    sourceReleaseDate: null,
    watchmodeData: title,
    genres: title.genres,
  };
}
