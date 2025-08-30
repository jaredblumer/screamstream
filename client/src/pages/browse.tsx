import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import FilterControls from '@/components/filter-controls';
import MovieGrid from '@/components/movie-grid';
import Footer from '@/components/footer';
import { useSearch } from '@/contexts/SearchContext';

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

  // Parse URL parameters and set initial subgenre
  useEffect(() => {
    const fullUrl = window.location.search;
    const urlParams = new URLSearchParams(fullUrl);
    const subgenreParam = urlParams.get('subgenre') || 'all';
    setSelectedSubgenre(subgenreParam);
  }, [location]);

  // Helper function to format subgenre display name
  const getHeaderTitle = (subgenre: string) => {
    if (selectedSubgenre !== 'all') {
      let title = subgenre
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return (
        <h1 className="text-4xl sm:text-5xl font-bold text-white text-center">
          Explore <span className="blood-red">{title}</span> Titles
        </h1>
      );
    }
    return (
      <h1 className="text-4xl sm:text-5xl font-bold text-white text-center">
        Browse <span className="blood-red">Streaming Horror</span>
      </h1>
    );
  };

  return (
    <>
      <div className="horror-bg">
        <div className="text-center mx-auto px-6 py-8 sm:py-12 animate-fade-in">
          <div className="mb-2">{getHeaderTitle(selectedSubgenre)}</div>
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
