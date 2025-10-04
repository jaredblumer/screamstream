import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';
import Footer from '@/components/footer';
import MovieCard from '@/components/movie-card';
import type { ContentWithPlatforms } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/contexts/SearchContext';
import { Helmet } from 'react-helmet-async';
import { trackPageview } from '@/lib/analytics';

type SubgenreLite = { id: number; name: string; slug: string };
type MovieForCard = ContentWithPlatforms & { primarySubgenre: SubgenreLite | null };

export default function NewToStreaming() {
  const [, setLocation] = useLocation();
  const { setQuery } = useSearch();

  useEffect(() => {
    setQuery('');
  }, [setQuery]);

  // Fire GA pageview when this page is mounted
  useEffect(() => {
    const path = `${window.location.pathname}${window.location.search}`;
    trackPageview(path, 'New to Streaming – FrightByte');
  }, []);

  // Fetch new to streaming content
  const {
    data: streamingContent = [],
    isLoading,
    error,
  } = useQuery<MovieForCard[]>({
    queryKey: ['/api/new-to-streaming'],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading… – FrightByte</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-screen horror-bg">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-12">
              <Skeleton className="h-12 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Error Loading – FrightByte</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-screen horror-bg">
          <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                New to <span className="blood-red">Streaming</span>
              </h1>
              <div className="max-w-md mx-auto bg-red-900/20 border border-red-500/50 rounded-lg p-6">
                <p className="text-red-400 mb-2">Unable to load streaming releases</p>
                <p className="text-gray-400 text-sm">
                  There was an issue fetching the latest streaming content. Please try again later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>New to Streaming – FrightByte</title>
        <meta
          name="description"
          content="Discover the latest horror movies and series that just landed on popular streaming platforms. Fresh scares, updated weekly."
        />
        <meta property="og:title" content="New to Streaming – FrightByte" />
        <meta
          property="og:description"
          content="Discover the latest horror movies and series that just landed on popular streaming platforms."
        />
      </Helmet>

      <div className="horror-bg">
        <div className="text-center mx-auto px-6 py-8 sm:py-12 animate-fade-in">
          <div className="mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-white text-center">
              New to <span className="blood-red">Streaming</span>
            </h1>
          </div>
          <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Discover the latest horror movies and series that just landed on popular streaming
            platforms. Fresh scares, updated weekly.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400 mt-2">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Updated weekly
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="max-w-7xl mx-auto animate-slide-up">
          {streamingContent.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-white mb-2">No Recent Content Found</h3>
                <p className="text-gray-400">
                  No new horror titles have been added to streaming platforms recently. Check back
                  soon!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-6">
              {streamingContent.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => setLocation(`/title/${movie.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center p-6 rounded-lg border border-gray-700 dark-gray-bg animate-slide-up stagger-2">
            <h3 className="text-2xl font-bold text-white mb-4">Find Your Next Fright</h3>
            <p className="text-gray-300 mb-6">
              Discover cult classics, hidden gems, and spine-chilling surprises lurking below the
              surface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse">
                <Button className="horror-button-primary">Browse More Movies</Button>
              </Link>
              <Link href="/subgenres">
                <Button variant="outline" className="horror-button-outline">
                  Explore Subgenres
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
