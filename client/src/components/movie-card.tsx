import { Star, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformLogo, formatSubgenre } from '@/lib/utils';
import { useWatchlist } from '@/hooks/use-watchlist';
import type { ContentWithPlatforms } from '@shared/schema';
import { useState } from 'react';

interface MovieCardProps {
  movie: ContentWithPlatforms;
  onClick: () => void;
  selectedSubgenre?: string;
  onWatchlistToggle?: () => void;
}

export default function MovieCard({
  movie,
  onClick,
  selectedSubgenre,
  onWatchlistToggle,
}: MovieCardProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(movie.id);
  const [posterError, setPosterError] = useState(false);

  // Use placeholder if poster URL is missing or failed to load
  const displayPosterUrl =
    posterError || !movie.posterUrl || movie.posterUrl.trim() === ''
      ? '/posters/default_poster.svg'
      : movie.posterUrl;

  // Helper function to determine which subgenre to display
  const getDisplaySubgenre = () => {
    if (selectedSubgenre && selectedSubgenre !== 'all') {
      const matchingSubgenre = movie.subgenres?.find(
        (subgenre) => subgenre.toLowerCase() === selectedSubgenre.toLowerCase()
      );
      if (matchingSubgenre) {
        return formatSubgenre(matchingSubgenre);
      }
    }
    return formatSubgenre(movie.subgenre);
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    const success = await toggleWatchlist(movie.id);
    if (success) {
      onWatchlistToggle?.();
    }
  };

  const isSeries = movie.type === 'series';

  return (
    <div
      className="movie-card dark-gray-bg rounded-lg overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer group transition-transform duration-300 hover:scale-105"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={displayPosterUrl}
          alt={`${movie.title} poster`}
          className="w-full h-80 object-cover"
          onError={() => setPosterError(true)}
        />
        {/* Content Type Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isSeries ? 'bg-red-800 text-white' : 'bg-gray-800 text-white'
            }`}
          >
            {isSeries ? 'SERIES' : 'MOVIE'}
          </span>
        </div>
        {/* Rating Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {movie.criticsRating && (
            <div className="bg-black bg-opacity-80 text-white rounded px-2 py-1 text-xs flex items-center">
              <Star className="inline w-3 h-3 mr-1 horror-orange fill-current" />
              {movie.criticsRating.toFixed(1)}
            </div>
          )}
          {movie.usersRating && (
            <div className="bg-black bg-opacity-80 text-white rounded px-2 py-1 text-xs flex items-center">
              <User className="inline w-3 h-3 mr-1 text-red-400" />
              {movie.usersRating.toFixed(1)}
            </div>
          )}
        </div>
        {/* Watchlist Button */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant={inWatchlist ? 'default' : 'outline'}
            onClick={handleWatchlistClick}
            className={`${
              inWatchlist ? 'horror-button-primary' : 'horror-button-outline'
            } backdrop-blur-sm`}
          >
            <Heart className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">{movie.title}</h3>
        <p className="text-gray-400 text-sm mb-2">
          {movie.year} • {getDisplaySubgenre()}
          {isSeries && movie.seasons && movie.episodes && (
            <span className="ml-2 text-red-400">
              • {movie.seasons} Season{movie.seasons > 1 ? 's' : ''} • {movie.episodes} Episodes
            </span>
          )}
        </p>
        <p className="text-gray-300 text-sm line-clamp-2 mb-3">{movie.description}</p>

        {/* Streaming Platforms */}
        <div className="flex items-center gap-2">
          {movie.platformsBadges?.map((badge) => {
            const { platformId, platformName, imageUrl, webUrl } = badge;

            const logo = (
              <img
                src={imageUrl || getPlatformLogo(platformId)}
                alt={platformName}
                title={`Watch on ${platformName}`}
                className="w-6 h-6 rounded platform-logo transition-transform hover:scale-110 cursor-pointer"
              />
            );

            // Helper to stop card navigation when clicking a badge
            const stop = (e: React.MouseEvent) => e.stopPropagation();

            return webUrl ? (
              <a
                key={platformId}
                href={webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-opacity hover:opacity-80"
                title={`Watch "${movie.title}" on ${platformName}`}
                onClick={stop}
                onAuxClick={stop} // middle click
              >
                {logo}
              </a>
            ) : (
              <div key={platformId} className="inline-block" onClick={stop} onAuxClick={stop}>
                {logo}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
