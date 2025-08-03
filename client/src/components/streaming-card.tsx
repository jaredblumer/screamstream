import { Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatformLogo, getPlatformName, formatSubgenre } from '@/lib/utils';
import { useWatchlist } from '@/hooks/use-watchlist';
import type { Content } from '@shared/schema';
import { useState } from 'react';

interface StreamingCardProps {
  content: Content;
  onClick: () => void;
}

export default function StreamingCard({ content, onClick }: StreamingCardProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(content.id);
  const [posterError, setPosterError] = useState(false);

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    await toggleWatchlist(content.id);
  };

  const isMovie = content.type === 'movie';
  const isSeries = content.type === 'series';

  // Format the release date for display
  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className="movie-card dark-gray-bg rounded-lg overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer group transition-transform duration-300 hover:scale-105"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={
            posterError || !content.posterUrl || content.posterUrl.trim() === ''
              ? '/posters/default_poster.svg'
              : content.posterUrl
          }
          alt={`${content.title} poster`}
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

        {/* Release Date Badge */}
        <div className="absolute top-2 right-2">
          <div className="bg-black bg-opacity-80 text-white rounded px-2 py-1 text-xs flex items-center">
            <Clock className="inline w-3 h-3 mr-1 text-green-400" />
            {content.sourceReleaseDate ? formatReleaseDate(content.sourceReleaseDate) : 'New'}
          </div>
        </div>

        {/* Watchlist Button */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleWatchlistClick}
            className="bg-black bg-opacity-80 hover:bg-black hover:bg-opacity-90 text-white border-none"
          >
            <Heart
              className={`w-4 h-4 ${inWatchlist ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </Button>
        </div>

        {/* Streaming Platform Badge */}
        <div className="absolute bottom-2 left-2">
          {content.platforms && content.platforms.length > 0 && (
            <div className="bg-black bg-opacity-80 text-white rounded px-2 py-1 text-xs">
              {getPlatformName(content.platforms[0])}
            </div>
          )}
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
          {content.title}
        </h3>

        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>{content.year}</span>
          <span className="capitalize">{formatSubgenre(content.subgenre)}</span>
        </div>

        <p className="text-sm text-gray-400 line-clamp-2">{content.description}</p>
      </div>
    </div>
  );
}
