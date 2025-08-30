import Footer from '@/components/footer';
import MovieGrid from '@/components/movie-grid';
import { useSearch } from '@/contexts/SearchContext';

export default function Search() {
  const { query: searchQuery } = useSearch();

  return (
    <div className="min-h-screen horror-bg">
      <div className="max-w-7xl mx-auto animate-slide-up mt-6">
        <div className="px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            {searchQuery.trim().length === 0
              ? 'Search for Streaming Horror Titles'
              : `Search Results for "${searchQuery}"`}
          </h1>
        </div>

        <MovieGrid
          searchQuery={searchQuery}
          selectedPlatform="all"
          selectedYear="all"
          selectedCriticsRating="all"
          selectedUsersRating="all"
          selectedType="all"
          selectedSubgenre="all"
          sortBy="rating"
        />
      </div>

      <Footer />
    </div>
  );
}
