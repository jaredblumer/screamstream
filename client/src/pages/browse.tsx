import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import FilterControls from "@/components/filter-controls";
import MovieGrid from "@/components/movie-grid";

export default function Browse() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCriticsRating, setSelectedCriticsRating] = useState("all");
  const [selectedUsersRating, setSelectedUsersRating] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSubgenre, setSelectedSubgenre] = useState("all");
  const [sortBy, setSortBy] = useState("rating");

  
  // Parse URL parameters and set initial subgenre
  useEffect(() => {
    const fullUrl = window.location.search;
    const urlParams = new URLSearchParams(fullUrl);
    const subgenreParam = urlParams.get('subgenre') || 'all';
    setSelectedSubgenre(subgenreParam);
  }, [location]);
  
  // Helper function to format subgenre display name
  const getHeaderTitle = (subgenre: string) => {
    if (selectedSubgenre !== "all") {
      return subgenre
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return "Browse Horror Content";
  };

  const getHeaderSubtitle = () => {
    if (selectedSubgenre !== "all") {
      return `Discover the best ${selectedSubgenre.split('-').join(' ')} movies and series`;
    }
    if (searchQuery) {
      return "Matching content based on your search";
    }
    return "Filter and explore our complete horror collection";
  };

  return (
    <>
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="min-h-screen horror-bg">
        {/* Browse Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl font-bold text-white mb-4">
              {getHeaderTitle(selectedSubgenre)}
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              {getHeaderSubtitle()}
            </p>
          </div>
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
            showSubgenreFilter={true}
          />

        </div>

        {/* Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="animate-fade-slide stagger-2">
            <MovieGrid
              searchQuery={searchQuery}
              selectedPlatform={selectedPlatform}
              selectedYear={selectedYear}
              selectedCriticsRating={selectedCriticsRating}
              selectedUsersRating={selectedUsersRating}
              selectedType={selectedType}
              selectedSubgenre={selectedSubgenre}
              sortBy={sortBy}
              onHeaderUpdate={() => {}}
            />
          </div>
        </div>
      </div>
    </>
  );
}