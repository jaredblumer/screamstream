import Header from '@/components/header';
import Footer from '@/components/footer';
import MovieGrid from '@/components/movie-grid';
import { useSearch } from '@/contexts/SearchContext';

export default function Search() {
  const { query: searchQuery } = useSearch();

  return (
    <div className="min-h-screen horror-bg">
      <Header autoFocusSearch />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold text-white mb-4">
            {searchQuery.trim().length === 0
              ? 'Search for Streaming Horror Titles'
              : `Search Results for "${searchQuery}"`}
          </h1>

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
      </div>

      <Footer />
    </div>
  );
}
