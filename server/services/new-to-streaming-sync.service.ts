import { storage } from '../storage';

interface SyncSummary {
  newTitlesAdded: number;
  duplicatesSkipped: number;
  totalProcessed: number;
  apiCallsUsed: number;
  timestamp: string;
}

export class NewToStreamingSyncService {
  async sync(): Promise<SyncSummary> {
    const { watchmodeAPI } = await import('../watchmode.js');
    const { tvdbAPI } = await import('../tvdb.js');

    const popularPlatforms = {
      Netflix: 203,
      'Amazon Prime Video': 26,
      Hulu: 157,
      'HBO Max': 384,
      Shudder: 99,
      Tubi: 283,
    };

    const horrorReleases: any[] = [];

    // 1. Fetch from Watchmode's horror search
    try {
      const horrorSearchResults = await watchmodeAPI.searchTitles({
        genres: [11],
        source_ids: Object.values(popularPlatforms),
        sort_by: 'release_date_desc',
        limit: 15,
      });

      for (const title of horrorSearchResults.titles.slice(0, 8)) {
        try {
          const fullTitleDetails = await watchmodeAPI.getTitleDetails(title.id);
          let availablePlatforms = ['Various Platforms'];

          if (fullTitleDetails.sources?.length > 0) {
            const streamingPlatforms = fullTitleDetails.sources
              .filter((source: any) =>
                ['subscription', 'free', 'subscription_with_ads'].includes(source.type)
              )
              .map((source: any) => source.name)
              .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index)
              .slice(0, 3);

            if (streamingPlatforms.length > 0) {
              availablePlatforms = streamingPlatforms;
            }
          }

          horrorReleases.push({
            id: title.id,
            title: fullTitleDetails.title,
            type: fullTitleDetails.type,
            imdb_id: fullTitleDetails.imdb_id,
            tmdb_id: fullTitleDetails.tmdb_id,
            poster_url: fullTitleDetails.poster,
            source_release_date:
              fullTitleDetails.release_date || new Date().toISOString().split('T')[0],
            source_id: 203,
            source_name: availablePlatforms[0],
            is_original: 0,
            plot_overview: fullTitleDetails.plot_overview,
            user_rating: fullTitleDetails.user_rating,
            critic_score: fullTitleDetails.critic_score,
            genre_names: fullTitleDetails.genre_names,
            year: fullTitleDetails.year,
            runtime_minutes: fullTitleDetails.runtime_minutes,
            us_rating: fullTitleDetails.us_rating,
            backdrop: fullTitleDetails.backdrop,
            available_platforms: availablePlatforms,
          });
        } catch {}
      }
    } catch {}

    // 2. Add any Shudder releases directly from Watchmode's release list
    const releases = await watchmodeAPI.getRecentReleases({
      source_ids: Object.values(popularPlatforms),
      change_type: 'new,subscription',
      types: 'movie,tv',
      days_back: 30,
      limit: 100,
    });

    horrorReleases.push(...releases.filter((r: any) => r.source_name === 'Shudder'));

    // 3. Filter and enrich remaining non-Shudder releases via TVDB
    const recentWithImdb = releases
      .filter((r: any) => r.imdb_id && r.source_name !== 'Shudder')
      .slice(0, 5);

    for (const release of recentWithImdb) {
      try {
        let hasHorrorGenre = false;

        if (release.type === 'tv_series') {
          const series = await tvdbAPI.getSeriesByRemoteId(release.imdb_id);
          hasHorrorGenre = series?.genres?.some((g: any) =>
            ['Horror', 'Thriller', 'Mystery', 'Suspense'].includes(g.name)
          );
        } else {
          const movie = await tvdbAPI.getMovieByRemoteId(release.imdb_id);
          hasHorrorGenre = movie?.genres?.some((g: any) =>
            ['Horror', 'Thriller', 'Mystery', 'Suspense'].includes(g.name)
          );
        }

        if (hasHorrorGenre) horrorReleases.push(release);
      } catch {}
    }

    // 4. Convert and save to DB
    const newContent = horrorReleases.slice(0, 15).map((release: any, index: number) => {
      const type = release.type === 'tv_series' ? 'series' : 'movie';
      return {
        id: index + 1000,
        title: release.title,
        year: release.year || new Date(release.source_release_date).getFullYear(),
        rating: release.critic_score ? release.critic_score / 10 : release.user_rating || 6.5,
        criticsRating: release.critic_score ? release.critic_score / 10 : 6.5,
        usersRating: release.user_rating || 6.5,
        description:
          release.plot_overview ||
          `A ${type} available on streaming platforms${
            release.genre_names ? ` - Genres: ${release.genre_names.join(', ')}` : ''
          }`,
        posterUrl: release.poster_url || '/posters/default_poster.svg',
        platforms: release.available_platforms || [release.source_name],
        platformLinks: [],
        type,
        seasons: null,
        episodes: null,
        sourceReleaseDate: release.source_release_date,
        runtimeMinutes: release.runtime_minutes || 0,
        usRating: release.us_rating || '',
        backdropUrl: release.backdrop || '',
        originalTitle: release.title,
        releaseDate: release.source_release_date,
        originalLanguage: 'en',
        endYear: null,
        watchmodeData: release,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const savedContent = [];

    for (const content of newContent) {
      try {
        const existing = await storage.getContent();
        const isDuplicate = existing.some(
          (e) =>
            e.title.toLowerCase().trim() === content.title.toLowerCase().trim() &&
            e.year === content.year
        );

        if (!isDuplicate) {
          const { id, ...rest } = content;
          const saved = await storage.createContent(rest);
          savedContent.push(saved);
        } else {
          const match = existing.find(
            (e) => e.title.toLowerCase() === content.title.toLowerCase() && e.year === content.year
          );
          if (match) savedContent.push(match);
        }
      } catch {
        savedContent.push(content);
      }
    }

    const actualNewItems = savedContent.filter(
      (item) => typeof item.id === 'number' && item.id > 0
    ).length;
    const duplicatesSkipped = newContent.length - actualNewItems;

    return {
      newTitlesAdded: actualNewItems,
      duplicatesSkipped,
      totalProcessed: newContent.length,
      apiCallsUsed: watchmodeAPI.getRequestCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
