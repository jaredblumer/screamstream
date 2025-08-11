import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Star, Calendar, Heart, Share, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { getPlatformLogo, getPlatformName, formatSubgenre } from '@/lib/utils';
import FeedbackButton from '@/components/feedback-button';
import { useSearch } from '@/contexts/SearchContext';
import type { ContentWithPlatforms } from '@shared/schema';

export default function MovieDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/title/:id');
  const movieId = params?.id ? parseInt(params.id) : 0;
  const [posterError, setPosterError] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { toast } = useToast();
  const { setQuery } = useSearch();

  useEffect(() => {
    setQuery('');
  }, []);

  const {
    data: movie,
    isLoading,
    error,
  } = useQuery<ContentWithPlatforms>({
    queryKey: ['/api/content', movieId],
    queryFn: async () => {
      const response = await fetch(`/api/content/${movieId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch title details');
      }
      return response.json();
    },
    enabled: movieId > 0,
  });

  if (!match || movieId === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen horror-bg flex items-center justify-center">
          <Alert className="max-w-md dark-gray-bg border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">Invalid title ID</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen horror-bg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-8 w-32 mb-8 horror-bg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Skeleton className="h-96 lg:h-[600px] horror-bg" />
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-12 w-3/4 horror-bg" />
                <Skeleton className="h-6 w-1/2 horror-bg" />
                <Skeleton className="h-32 w-full horror-bg" />
                <Skeleton className="h-8 w-1/4 horror-bg" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !movie) {
    return (
      <>
        <Header />
        <div className="min-h-screen horror-bg flex items-center justify-center">
          <Alert className="max-w-md dark-gray-bg border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">
              Failed to load title. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="horror-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-8 horror-button-ghost"
            onClick={() => setLocation('/browse')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse Titles
          </Button>

          {/* Header with Image and Title */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Movie Poster */}
            <div className="flex-shrink-0">
              <div className="relative">
                <img
                  src={
                    posterError || !movie.posterUrl || movie.posterUrl.trim() === ''
                      ? '/posters/default_poster.svg'
                      : movie.posterUrl
                  }
                  alt={`${movie.title} poster`}
                  className="w-48 h-72 object-cover rounded-lg shadow-2xl"
                  onError={() => setPosterError(true)}
                />
              </div>
            </div>

            {/* Movie Title and Basic Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{movie.title}</h1>

              <div className="flex flex-wrap items-center gap-6 mb-4 text-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {movie.year}
                </div>
                <div className="flex items-center">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      movie.type === 'series' ? 'bg-red-800 text-white' : 'bg-gray-800 text-white'
                    }`}
                  >
                    {movie.type === 'series' ? 'SERIES' : 'MOVIE'}
                  </span>
                </div>
                {movie.type === 'series' && movie.seasons && movie.episodes && (
                  <div className="flex items-center text-red-400">
                    <span className="text-sm">
                      {movie.seasons} Season{movie.seasons > 1 ? 's' : ''} • {movie.episodes}{' '}
                      Episodes
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  {movie.criticsRating && (
                    <div className="flex items-center">
                      <Star className="h-5 w-5 mr-2 horror-orange fill-current" />
                      {movie.criticsRating.toFixed(1)} Critics
                    </div>
                  )}
                  {movie.usersRating && (
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-red-400" />
                      {movie.usersRating.toFixed(1)} Audience
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {movie.subgenres && movie.subgenres.length > 0 ? (
                    movie.subgenres.map((subgenre, index) => (
                      <span
                        key={index}
                        className="inline-block blood-red-bg text-white px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {formatSubgenre(subgenre)}
                      </span>
                    ))
                  ) : (
                    <span className="inline-block blood-red-bg text-white px-3 py-1 rounded-full text-sm font-medium">
                      {formatSubgenre(movie.subgenre)}
                    </span>
                  )}
                </div>
              </div>

              {/* Streaming Platforms */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-3">Available On</h3>
                <div className="flex flex-wrap gap-3">
                  {movie.platformsBadges.map((badge) => {
                    const { platformId, platformName, imageUrl, webUrl } = badge;
                    const PlatformComponent = webUrl ? 'a' : 'div';

                    return (
                      <PlatformComponent
                        key={platformId}
                        href={webUrl ?? undefined}
                        target={webUrl ? '_blank' : undefined}
                        rel={webUrl ? 'noopener noreferrer' : undefined}
                        className={`flex items-center dark-gray-bg rounded-lg px-3 py-2 border border-gray-700 ${
                          webUrl ? 'hover:bg-gray-700 transition-colors cursor-pointer' : ''
                        }`}
                        title={webUrl ? `Watch on ${platformName}` : platformName}
                      >
                        <img
                          src={imageUrl || getPlatformLogo(platformId)}
                          alt={platformName || getPlatformName(platformId)}
                          className="w-6 h-6 rounded mr-2"
                        />
                        <span className="text-white text-sm font-medium">
                          {platformName || getPlatformName(platformId)}
                        </span>
                        {webUrl && <span className="ml-2 text-xs text-gray-400">↗</span>}
                      </PlatformComponent>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  className={`px-4 py-2 ${
                    isInWatchlist(movieId) ? 'horror-button-secondary' : 'horror-button-primary'
                  }`}
                  onClick={async () => {
                    const wasInWatchlist = isInWatchlist(movieId);
                    const success = await toggleWatchlist(movieId);

                    if (success) {
                      toast({
                        title: wasInWatchlist ? 'Removed from Watchlist' : 'Added to Watchlist',
                        description: wasInWatchlist
                          ? `${movie.title} has been removed from your watchlist.`
                          : `${movie.title} has been added to your watchlist.`,
                      });
                    }
                  }}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${isInWatchlist(movieId) ? 'fill-current' : ''}`}
                  />
                  {isInWatchlist(movieId) ? 'In Watchlist' : 'Add to Watchlist'}
                </Button>
                <Button
                  variant="outline"
                  className="horror-button-outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: 'Link Copied',
                      description: "This title's link has been copied to your clipboard.",
                    });
                  }}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share Movie
                </Button>
                <FeedbackButton
                  contentId={movieId}
                  initialType="data_error"
                  initialTitle={`Issue with "${movie.title}"`}
                  variant="outline"
                  className="horror-button-outline"
                />
              </div>
            </div>
          </div>

          {/* Synopsis Section */}
          <div className="mb-0">
            <h2 className="text-xl font-semibold text-white mb-3">Synopsis</h2>
            <p className="text-gray-300 leading-relaxed text-lg">{movie.description}</p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
