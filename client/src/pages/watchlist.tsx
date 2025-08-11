import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import MovieCard from '@/components/movie-card';
import { useWatchlistCount } from '@/contexts/WatchlistCountContext';
import { useAuth } from '@/hooks/use-auth';

export default function Watchlist() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { watchlistContent, refreshWatchlist, isWatchlistLoading } = useWatchlistCount();

  if (isWatchlistLoading) {
    return (
      <>
        <Header />
        <div className="horror-bg">
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

  return (
    <>
      <Header />

      <div className="horror-bg">
        <div className="text-center mx-auto px-2 py-12 animate-fade-in">
          <div className="mb-2">
            <h1 className="text-5xl font-bold text-white text-center">
              My <span className="blood-red">Watchlist</span>
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Your personal collection of upcoming scares.
          </p>
        </div>

        {!isWatchlistLoading && watchlistContent.length === 0 && (
          <div className="mx-auto max-w-7xl">
            <div className="text-center animate-slide-up mb-16">
              <Heart className="h-16 w-16 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Your watchlist is empty</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start building your horror movie collection by adding films you want to watch.
              </p>
              {user ? (
                <Link href="/browse">
                  <Button className="horror-button-primary px-8 py-3">Browse Movies</Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button className="horror-button-primary px-8 py-3">Log In to Add Movies</Button>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          {watchlistContent.length > 0 && (
            <div className="max-w-7xl animate-fade-slide stagger-1 px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {watchlistContent.map((content) => (
                  <MovieCard
                    key={content.id}
                    movie={content}
                    onClick={() => setLocation(`/title/${content.id}`)}
                    onWatchlistToggle={async () => {
                      await refreshWatchlist();
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {watchlistContent.length > 0 && (
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
        )}
      </div>

      <Footer />
    </>
  );
}
