import { useEffect, useMemo } from 'react';
import Footer from '@/components/footer';
import MovieGrid from '@/components/movie-grid';
import { useSearch } from '@/contexts/SearchContext';
import { Helmet } from 'react-helmet-async';
import { trackPageview, trackEvent } from '@/lib/analytics';

const useDebouncedValue = <T,>(value: T, delay = 600) => {
  const v = useMemo(() => ({ current: value }), [value]);
  useEffect(() => {
    v.current = value;
  }, [value, v]);
  return useMemo(() => {
    let id: number | undefined;
    return (fn: (val: T) => void) => {
      if (id) window.clearTimeout(id);
      id = window.setTimeout(() => fn(v.current), delay);
    };
  }, [delay, v]);
};

export default function Search() {
  const { query: searchQuery } = useSearch();

  const title =
    searchQuery.trim().length === 0
      ? 'Search Horror Movies & Series – FrightByte'
      : `Search Results for "${searchQuery}" – FrightByte`;

  const description =
    searchQuery.trim().length === 0
      ? 'Search for streaming horror titles across all platforms. Discover your next scare on FrightByte.'
      : `Explore horror movies and series results for "${searchQuery}" on FrightByte.`;

  useEffect(() => {
    const path = `${window.location.pathname}`; // omit query to avoid cardinality
    trackPageview(path, 'Search – FrightByte');
  }, []);

  const runDebounced = useDebouncedValue(searchQuery, 700);
  useEffect(() => {
    runDebounced((q) => {
      const clean = q.trim();
      if (clean.length === 0) return;

      trackEvent('Search', 'search_performed', clean);
    });
  }, [searchQuery, runDebounced]);

  return (
    <>
      <Helmet>
        <title>Search – FrightByte</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Helmet>

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
    </>
  );
}
