import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import MovieCard from './movie-card';
import type { ContentWithPlatforms } from '@shared/schema';

interface MovieGridProps {
  searchQuery?: string;
  selectedPlatform?: string;
  selectedYear?: string;
  selectedCriticsRating?: string;
  selectedUsersRating?: string;
  selectedType?: string;
  selectedSubgenre?: string;
  sortBy?: string;
}

export default function MovieGrid({
  searchQuery = '',
  selectedPlatform = 'all',
  selectedYear = 'all',
  selectedCriticsRating = 'all',
  selectedUsersRating = 'all',
  selectedType = 'all',
  selectedSubgenre = 'all',
  sortBy = 'rating',
}: MovieGridProps) {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const moviesPerPage = 15;

  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.append('search', searchQuery);
  if (selectedPlatform !== 'all') queryParams.append('platform', selectedPlatform);
  if (selectedYear !== 'all') queryParams.append('year', selectedYear);
  if (selectedCriticsRating !== 'all')
    queryParams.append('minCriticsRating', selectedCriticsRating);
  if (selectedUsersRating !== 'all') queryParams.append('minUsersRating', selectedUsersRating);
  if (selectedType !== 'all') queryParams.append('type', selectedType);
  if (selectedSubgenre !== 'all') queryParams.append('subgenre', selectedSubgenre);
  if (sortBy) queryParams.append('sortBy', sortBy);

  const {
    data: fetchedMovies,
    isLoading,
    error,
  } = useQuery<ContentWithPlatforms[]>({
    queryKey: ['/api/content', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/content?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    },
    enabled: true,
  });

  const movies = fetchedMovies || [];

  const handleMovieClick = (movieId: number) => {
    setLocation(`/title/${movieId}`);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-2">
        <div className="mb-8">
          <Skeleton className="h-4 w-48 horror-bg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-80 w-full horror-bg" />
              <Skeleton className="h-4 w-full horror-bg" />
              <Skeleton className="h-4 w-20 horror-bg" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-2">
        <Alert className="max-w-md mx-auto dark-gray-bg border-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-white">
            Failed to load movies. Please try again later.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-2">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No titles found</h3>
          <p className="text-gray-400">
            Try adjusting your filters or search terms to find horror titles.
          </p>
        </div>
      </main>
    );
  }

  const displayedMovies = movies.slice(0, page * moviesPerPage);
  const hasMore = movies.length > displayedMovies.length;

  return (
    <main className="max-w-7xl mx-auto px-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {displayedMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => handleMovieClick(movie.id)}
            selectedSubgenre={selectedSubgenre}
          />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-12">
          <Button
            onClick={handleLoadMore}
            className="blood-red-bg hover:crimson-bg text-white px-8 py-3 font-semibold"
          >
            Load More
          </Button>
        </div>
      )}
    </main>
  );
}
