import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import FilterControls from '@/components/filter-controls';
import MovieGrid from '@/components/movie-grid';
import Footer from '@/components/footer';
import { useSearch } from '@/contexts/SearchContext';
import { trackPageview } from '@/lib/analytics';

function humanize(sub: string) {
  return sub
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function Browse() {
  const [location] = useLocation();
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCriticsRating, setSelectedCriticsRating] = useState('all');
  const [selectedUsersRating, setSelectedUsersRating] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubgenre, setSelectedSubgenre] = useState('all');
  const [sortBy, setSortBy] = useState('average_rating');
  const { setQuery } = useSearch();

  useEffect(() => {
    setQuery('');
  }, [setQuery]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setSelectedSubgenre(urlParams.get('subgenre') || 'all');
  }, [location]);

  const pageTitle = useMemo(() => {
    return selectedSubgenre !== 'all'
      ? `Browse ${humanize(selectedSubgenre)} Titles – FrightByte`
      : `Browse Streaming Horror – FrightByte`;
  }, [selectedSubgenre]);

  useEffect(() => {
    const fullPath = `${window.location.pathname}${window.location.search}`;
    trackPageview(fullPath, pageTitle);
  }, [location, pageTitle]);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Filter by subgenre, decade, rating, or platform to discover your next watch."
        />
      </Helmet>

      <div className="horror-bg">
        <div className="text-center mx-auto px-6 py-8 sm:py-12 animate-fade-in">
          <div className="mb-2">
            {selectedSubgenre !== 'all' ? (
              <h1 className="text-4xl sm:text-5xl font-bold text-white text-center">
                Explore <span className="blood-red">{humanize(selectedSubgenre)}</span> Titles
              </h1>
            ) : (
              <h1 className="text-4xl sm:text-5xl font-bold text-white text-center">
                Browse <span className="blood-red">Streaming Horror</span>
              </h1>
            )}
          </div>
          <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Filter by subgenre, decade, rating, or platform to discover your next watch.
          </p>
        </div>

        {/* Filters */}
        <div className="animate-slide-up stagger-1">
          <FilterControls
            selectedPlatform={selectedPlatform}
            selectedYear={selectedYear}
            selectedCriticsRating={selectedCriticsRating}
            selectedUsersRating={selectedUsersRating}
            selectedType={selectedType}
            selectedSubgenre={selectedSubgenre}
            sortBy={sortBy}
            onPlatformChange={setSelectedPlatform}
            onYearChange={setSelectedYear}
            onCriticsRatingChange={setSelectedCriticsRating}
            onUsersRatingChange={setSelectedUsersRating}
            onTypeChange={setSelectedType}
            onSubgenreChange={setSelectedSubgenre}
            onSortChange={setSortBy}
          />
        </div>

        {/* Content Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="animate-fade-slide stagger-2">
            <MovieGrid
              selectedPlatform={selectedPlatform}
              selectedYear={selectedYear}
              selectedCriticsRating={selectedCriticsRating}
              selectedUsersRating={selectedUsersRating}
              selectedType={selectedType}
              selectedSubgenre={selectedSubgenre}
              sortBy={sortBy}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
