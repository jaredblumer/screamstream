import { InsertContent } from '@shared/schema';
import { WatchmodeRelease, WatchmodeSource, WatchmodeTitle } from '@server/types/watchmode';
import { getOptimalPosterUrl } from '@server/utils/watchmode-helpers';
import { popularStreamingPlatforms } from '@server/constants/platforms';

/**
 * Convert a Watchmode release into InsertContent format
 * Requires title information already loaded or assumes release.title is a WatchmodeTitle
 */
export async function convertWatchmodeReleaseToContent(
  release: WatchmodeRelease,
  platformSources: WatchmodeSource[] = []
): Promise<InsertContent> {
  const content = await convertWatchmodeTitleToContent(
    release as unknown as WatchmodeTitle,
    platformSources
  );
  content.sourceReleaseDate = release.source_release_date;
  return content;
}

/**
 * Convert Watchmode title to InsertContent
 */
export async function convertWatchmodeTitleToContent(
  title: WatchmodeTitle,
  platformSources: WatchmodeSource[] = []
): Promise<InsertContent> {
  const type = title.type === 'tv_series' ? 'series' : 'movie';

  const platforms: string[] = [];
  const platformLinks: string[] = [];

  if (title.sources?.length) {
    title.sources.forEach((source) => {
      const match = platformSources.find((p) => p.id === source.source_id);
      if (match && !platforms.includes(match.name)) {
        platforms.push(match.name);
        platformLinks.push(source.web_url || '');
      }
    });
  } else {
    // Fallback to random platform name
    const fallbackPlatforms = Object.keys(popularStreamingPlatforms);
    platforms.push(fallbackPlatforms[Math.floor(Math.random() * fallbackPlatforms.length)]);
  }

  // Optional: integrate TVDB poster lookup
  let tvdbPosterUrl = '';
  try {
    if (process.env.TVDB_API_KEY) {
      const { tvdbAPI } = await import('@server/tvdb'); // adjust path as needed
      if (title.imdb_id) {
        const lookup =
          title.type === 'tv_series'
            ? await tvdbAPI.getSeriesByRemoteId(title.imdb_id)
            : await tvdbAPI.getMovieByRemoteId(title.imdb_id);
        if (lookup?.image) {
          tvdbPosterUrl = tvdbAPI.getPosterUrl(lookup.image);
        }
      }

      // fallback to TVDB title search
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
    rating: title.critic_score ? title.critic_score / 10 : title.user_rating || 6.0,
    criticsRating: title.critic_score ? title.critic_score / 10 : 6.0,
    usersRating: title.user_rating || 0,
    description: title.plot_overview || `A ${type} from ${title.year}`,
    posterUrl: finalPosterUrl,
    platforms,
    platformLinks,
    type,
    seasons: type === 'series' ? null : null,
    episodes: type === 'series' ? null : null,
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
    sourceReleaseDate: null, // set by convertWatchmodeReleaseToContent
    watchmodeData: title as any,
  };
}
