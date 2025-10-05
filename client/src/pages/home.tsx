import { useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import Footer from '@/components/footer';
import HeroSection from '@/components/hero-section';
import FilterControls from '@/components/filter-controls';
import MovieGrid from '@/components/movie-grid';

export default function Home() {
  const [location, setLocation] = useLocation();
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCriticsRating, setSelectedCriticsRating] = useState('all');
  const [selectedUsersRating, setSelectedUsersRating] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubgenre, setSelectedSubgenre] = useState('all');
  const [sortBy, setSortBy] = useState('average_rating');

  const handleViewTopRated = () => {
    // Reset filters to show top rated movies
    setSelectedPlatform('all');
    setSelectedYear('all');
    setSelectedCriticsRating('all');
    setSelectedUsersRating('all');
    setSortBy('average_rating');

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

  const handleSubgenres = () => {
    setLocation('/subgenres');
  };

  return (
    <>
      <Helmet>
        <title>FrightByte - Top Rated Streaming Horror</title>
        <meta
          name="description"
          content="Discover the highest-rated horror movies and series streaming now."
        />
      </Helmet>

      <div className="min-h-screen horror-bg">
        <div className="mx-auto">
          <div className="transition-all duration-700 ease-in-out overflow-hidden max-h-none opacity-100 transform translate-y-0">
            <div className="transition-opacity duration-300">
              <div className="animate-fade-in bg-black/50">
                <HeroSection
                  onViewTopRanked={handleViewTopRated}
                  onBrowseGenres={handleSubgenres}
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
    </>
  );
}
