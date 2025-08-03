import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import MovieCard from '@/components/movie-card';
import { useWatchlistCount } from '@/contexts/WatchlistCountContext';
import { useWatchlist } from '@/hooks/use-watchlist';

export default function Watchlist() {
  const { isAuthenticated } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useLocation();
  const { watchlistContent, refreshWatchlist, isWatchlistLoading } = useWatchlistCount();

  const filteredContent = searchQuery.trim()
    ? watchlistContent.filter(
        (content) =>
          content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          content.subgenre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : watchlistContent;

  if (isWatchlistLoading) {
    return (
      <>
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="horror-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="horror-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl font-bold text-white mb-6">
              My <span className="blood-red">Watchlist</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Your personal collection of upcoming scares.
            </p>
          </div>

          {/* Loading */}
          {isWatchlistLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-80 w-full horror-bg" />
                  <Skeleton className="h-4 w-full horror-bg" />
                  <Skeleton className="h-4 w-20 horror-bg" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isWatchlistLoading && watchlistContent.length === 0 && (
            <div className="text-center py-16 animate-slide-up">
              <Heart className="h-16 w-16 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Your watchlist is empty</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start building your horror movie collection by adding films you want to watch.
              </p>
              <Link href="/">
                <Button className="horror-button-primary px-8 py-3">Browse Movies</Button>
              </Link>
            </div>
          )}

          {/* No results */}
          {watchlistContent.length > 0 && filteredContent.length === 0 && searchQuery.trim() && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
              <p className="text-gray-400">
                No watchlist items match "{searchQuery}". Try a different search term.
              </p>
            </div>
          )}

          {/* Grid */}
          {filteredContent.length > 0 && (
            <div className="animate-fade-slide stagger-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredContent.map((content) => (
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

          {/* Bottom CTA */}
          {watchlistContent.length > 0 && (
            <div className="text-center mt-8 p-8 rounded-lg border border-gray-700 dark-gray-bg animate-slide-up stagger-2">
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
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
