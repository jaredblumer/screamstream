import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/header';
import Footer from '@/components/footer';
import HeroSection from '@/components/hero-section';
import FilterControls from '@/components/filter-controls';
import MovieGrid from '@/components/movie-grid';

export default function Home() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCriticsRating, setSelectedCriticsRating] = useState('all');
  const [selectedUsersRating, setSelectedUsersRating] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubgenre, setSelectedSubgenre] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  // const [dynamicTitle, setDynamicTitle] = useState("Streaming Horror Rated");
  const [dynamicSubtitle, setDynamicSubtitle] = useState('');
  const [showHero, setShowHero] = useState(true);

  // Check for subgenre filter in URL on component mount
  useEffect(() => {
    const fullUrl = window.location.search;
    const urlParams = new URLSearchParams(fullUrl);
    const subgenreParam = urlParams.get('subgenre');
    if (subgenreParam && subgenreParam !== 'all') {
      setSelectedSubgenre(subgenreParam);
      // Use same logic as browse page to handle "horror" suffix
      const formatSubgenreTitle = (subgenre: string) => {
        return subgenre
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };
      const formattedSubgenre = formatSubgenreTitle(subgenreParam);
      const title = formattedSubgenre.toLowerCase().includes('horror')
        ? formattedSubgenre
        : `${formattedSubgenre} Horror`;
      // setDynamicTitle(title);
      // setDynamicSubtitle(`Discover the best ${subgenreParam.toLowerCase()} horror content`);
    }
  }, [location]);

  const handleViewTopRated = () => {
    // Reset filters to show top rated movies
    setSelectedPlatform('all');
    setSelectedYear('all');
    setSelectedCriticsRating('all');
    setSelectedUsersRating('all');
    setSortBy('rating');
    setSearchQuery('');

    // Scroll to filter section with smooth animation
    setTimeout(() => {
      const filterSection = document.querySelector('[data-filters]');
      if (filterSection) {
        const headerHeight = 64; // Account for sticky header
        const targetPosition =
          filterSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  const handleNewToStreaming = () => {
    setLocation('/new-to-streaming');
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen horror-bg">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Results */}
        <div
          className={`transition-all duration-700 ease-in-out overflow-hidden ${
            isSearching
              ? 'max-h-none opacity-100 transform translate-y-0'
              : 'max-h-0 opacity-0 transform -translate-y-4'
          }`}
        >
          <div
            className={`py-12 sm:py-16 mt-6 sm:mt-0 transition-opacity duration-300 ${
              isSearching ? 'delay-200' : 'delay-0'
            }`}
          >
            <div className="mb-8 animate-slide-up">
              <h1 className="text-4xl font-bold text-white mb-4">
                Search Results for "<span className="blood-red">{searchQuery}</span>"
              </h1>
              <p className="text-gray-300">Found horror movies matching your search</p>
            </div>
            <div className="animate-fade-slide stagger-1">
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
        </div>

        {/* Browse Content */}
        <div
          className={`transition-all duration-700 ease-in-out overflow-hidden ${
            !isSearching
              ? 'max-h-none opacity-100 transform translate-y-0'
              : 'max-h-0 opacity-0 transform -translate-y-4'
          }`}
        >
          <div
            className={`pt-8 sm:pt-0 transition-opacity duration-300 ${
              !isSearching ? 'delay-200' : 'delay-0'
            }`}
          >
            <div className="animate-fade-in">
              <HeroSection
                onViewTopRanked={handleViewTopRated}
                onBrowseGenres={() => {}}
                onNewToStreaming={handleNewToStreaming}
              />
            </div>

            <div className="animate-slide-up stagger-1" data-filters>
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

            <div className="animate-fade-slide stagger-2 pt-4 sm:pt-0">
              <MovieGrid
                searchQuery={searchQuery}
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
      </div>

      <Footer />
    </div>
  );
}
