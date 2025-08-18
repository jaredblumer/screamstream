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
import { formatSubgenre } from '@/lib/utils';
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
  }, [setQuery]);

  const {
    data: movie,
    isLoading,
    error,
  } = useQuery<ContentWithPlatforms>({
    queryKey: ['/api/content', movieId],
    queryFn: async () => {
      const response = await fetch(`/api/content/${movieId}`);
      if (!response.ok) throw new Error('Failed to fetch title details');
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

      {/* Sticky top bar (mobile only) */}
      <div className="md:hidden sticky top-0 z-30 bg-black/70 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => setLocation('/browse')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="horror-bg">
        <div className="max-w-6xl mx-auto px-6 sm:px-6 pt-0 md:pt-8 pb-6">
          {/* MOBILE layout */}
          <div className="md:hidden">
            {/* Media + meta in two columns: larger poster left, text right */}
            <div className="pt-4 rounded-lg">
              <div className="grid grid-cols-[auto,1fr] gap-4 items-start">
                <img
                  src={
                    posterError || !movie.posterUrl?.trim()
                      ? '/posters/default_poster.svg'
                      : movie.posterUrl
                  }
                  onError={() => setPosterError(true)}
                  alt={`${movie.title} poster`}
                  className="w-36 h-52 object-cover rounded-lg shadow-2xl"
                />

                <div className="min-w-0">
                  {/* Larger title */}
                  <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                    {movie.title}
                  </h1>

                  {/* Line 1: year / type / seasons */}
                  <div className="flex flex-wrap items-center gap-3 text-gray-200 text-sm">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {movie.year}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        movie.type === 'series' ? 'bg-red-700' : 'bg-gray-700'
                      }`}
                    >
                      {movie.type === 'series' ? 'SERIES' : 'MOVIE'}
                    </span>
                    {movie.type === 'series' && movie.seasons && movie.episodes && (
                      <span className="text-red-300">
                        {movie.seasons} season{movie.seasons > 1 ? 's' : ''} • {movie.episodes} ep
                      </span>
                    )}
                  </div>

                  {/* Line 2: ratings (to the right, beneath meta) */}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-200 text-sm">
                    {typeof movie.criticsRating === 'number' && (
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1 horror-orange fill-current" />
                        {movie.criticsRating.toFixed(1)} Critics
                      </span>
                    )}
                    {typeof movie.usersRating === 'number' && (
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-red-400" />
                        {movie.usersRating.toFixed(1)} Audience
                      </span>
                    )}
                  </div>

                  {/* Line 3: subgenres (right column) */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(movie.subgenres?.length ? movie.subgenres : [movie.subgenre])
                      .filter(Boolean)
                      .map((sg, i) => (
                        <span
                          key={i}
                          className="blood-red-bg text-white px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {formatSubgenre(sg)}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Platforms – wrap */}
            <div className="mt-4 mb-6">
              <h3 className="text-base font-semibold text-white mb-2">Available On</h3>
              <div className="flex flex-wrap gap-3">
                {movie.platformsBadges.map((badge) => {
                  const { platformId, platformName, imageUrl, webUrl } = badge;
                  const name = platformName;
                  const logo = imageUrl;
                  const Comp: any = webUrl ? 'a' : 'div';
                  return (
                    <Comp
                      key={platformId}
                      href={webUrl ?? undefined}
                      target={webUrl ? '_blank' : undefined}
                      rel={webUrl ? 'noopener noreferrer' : undefined}
                      className={`flex items-center dark-gray-bg rounded-xl px-3 py-2 border border-gray-700 ${
                        webUrl ? 'hover:bg-gray-700 transition-colors cursor-pointer' : ''
                      }`}
                      title={webUrl ? `Watch on ${name}` : name}
                    >
                      <img src={logo} alt={name} className="w-6 h-6 rounded mr-2" />
                      <span className="text-white text-sm font-medium">{name}</span>
                      {webUrl && <span className="ml-2 text-xs text-gray-400">↗</span>}
                    </Comp>
                  );
                })}
              </div>
            </div>

            {/* Synopsis (mobile) */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white mb-2">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">{movie.description}</p>
            </div>

            {/* Mobile action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                className={`flex-1 min-w-[48%] ${
                  isInWatchlist(movieId) ? 'horror-button-secondary' : 'horror-button-primary'
                }`}
                onClick={async () => {
                  const wasInWatchlist = isInWatchlist(movieId);
                  const ok = await toggleWatchlist(movieId);
                  if (ok) {
                    toast({
                      title: wasInWatchlist ? 'Removed from Watchlist' : 'Added to Watchlist',
                      description: wasInWatchlist
                        ? `${movie.title} has been removed from your watchlist.`
                        : `${movie.title} has been added to your watchlist.`,
                    });
                  }
                }}
              >
                <Heart className={`h-4 w-4 mr-2 ${isInWatchlist(movieId) ? 'fill-current' : ''}`} />
                {isInWatchlist(movieId) ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>

              <Button
                variant="outline"
                className="flex-1 min-w-[48%] horror-button-outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: 'Link Copied', description: 'URL saved to clipboard.' });
                }}
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* DESKTOP layout (original content) */}
          <div className="hidden md:block py-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="horror-button-ghost m-0 my-6"
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
                </div>

                {/* Ratings block (desktop) */}
                <div className="flex items-center gap-4 mb-4 text-gray-300">
                  {typeof movie.criticsRating === 'number' && (
                    <div className="flex items-center">
                      <Star className="h-5 w-5 mr-2 horror-orange fill-current" />
                      {movie.criticsRating.toFixed(1)} Critics
                    </div>
                  )}
                  {typeof movie.usersRating === 'number' && (
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-red-400" />
                      {movie.usersRating.toFixed(1)} Audience
                    </div>
                  )}
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
                          <img src={imageUrl} alt={platformName} className="w-6 h-6 rounded mr-2" />
                          <span className="text-white text-sm font-medium">{platformName}</span>
                          {webUrl && <span className="ml-2 text-xs text-gray-400">↗</span>}
                        </PlatformComponent>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons (desktop stays here) */}
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
                </div>
              </div>
            </div>

            {/* Synopsis Section (desktop) */}
            <div className="mb-0">
              <h2 className="text-xl font-semibold text-white mb-3">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed text-lg">{movie.description}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
