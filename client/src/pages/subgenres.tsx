import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Film, Star, Calendar } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import MovieGrid from '@/components/movie-grid';
import { Movie, Subgenre } from '@shared/schema';

interface SubgenreData {
  name: string;
  slug: string;
  description: string;
  count: number;
  topMovies: Movie[];
}

export default function Subgenres() {
  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = searchQuery.trim().length > 0;

  const { data: movies = [], isLoading: moviesLoading } = useQuery<Movie[]>({
    queryKey: ['/api/content'],
  });

  console.log('Movies loaded:', movies);

  const { data: subgenres = [], isLoading: subgenresLoading } = useQuery<Subgenre[]>({
    queryKey: ['/api/subgenres'],
  });

  console.log('Subgenres loaded:', subgenres);

  const isLoading = moviesLoading || subgenresLoading;

  const genreData: SubgenreData[] = React.useMemo(() => {
    if (!movies || !subgenres || movies.length === 0 || subgenres.length === 0) return [];

    return subgenres
      .filter((subgenre) => subgenre.isActive)
      .map((subgenre) => {
        const matchingMovies = movies.filter(
          (movie) =>
            movie.subgenre?.toLowerCase() === subgenre.slug ||
            movie.subgenres?.some((s) => s.toLowerCase() === subgenre.slug)
        );

        console.log(`Subgenre: ${subgenre.name}, Matching Movies: ${matchingMovies.length}`);

        const topMovies = matchingMovies.sort((a, b) => b.rating - a.rating).slice(0, 3);

        return {
          name: subgenre.name,
          slug: subgenre.slug,
          description: subgenre.description,
          count: matchingMovies.length,
          topMovies,
        };
      })
      .filter((genre) => genre.count > 0);
  }, [movies, subgenres]);

  console.log('Processed genre data:', genreData);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="horror-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-12">
              <Skeleton className="h-12 w-96 mx-auto mb-4" />
              <Skeleton className="h-6 w-[600px] mx-auto" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="horror-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Results */}
          <div
            className={`transition-all duration-700 ease-in-out overflow-hidden ${
              isSearching
                ? 'max-h-none opacity-100 transform translate-y-0'
                : 'max-h-0 opacity-0 transform -translate-y-4'
            }`}
          >
            <div
              className={`transition-opacity duration-300 ${isSearching ? 'delay-200' : 'delay-0'}`}
            >
              <div className="mb-8 animate-slide-up">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Search Results for "<span className="blood-red">{searchQuery}</span>"
                </h1>
                <p className="text-gray-300">Found streaming horror content matching your search</p>
              </div>
              <div className="animate-fade-slide stagger-1">
                <MovieGrid
                  searchQuery={searchQuery}
                  selectedPlatform="all"
                  selectedYear="all"
                  selectedCriticsRating="all"
                  selectedUsersRating="all"
                  selectedType="all"
                  sortBy="rating"
                />
              </div>
            </div>
          </div>

          {/* Genres Content */}
          <div
            className={`transition-all duration-700 ease-in-out overflow-hidden ${
              !isSearching
                ? 'max-h-none opacity-100 transform translate-y-0'
                : 'max-h-0 opacity-0 transform -translate-y-4'
            }`}
          >
            <div
              className={`transition-opacity duration-300 ${!isSearching ? 'delay-200' : 'delay-0'}`}
            >
              {/* Hero Section */}
              <div className="text-center mb-8 animate-fade-in">
                <h1 className="text-5xl font-bold text-white mb-8">
                  <span className="blood-red">Horror Subgenres</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Explore the highest-rated horror across streaming platforms. From supernatural
                  scares to psychological thrillers, discover what makes each subgenre uniquely
                  terrifying.
                </p>
              </div>

              {/* Genre Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-slide stagger-1">
                {genreData.map((genre) => (
                  <Card
                    key={genre.name}
                    className="dark-gray-bg border-gray-700 hover:border-red-500 transition-all duration-300 group"
                  >
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        {genre.name}
                        <Badge variant="secondary" className="bg-red-900 text-red-100">
                          {genre.count} titles
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {genre.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Top Movies */}
                      {genre.topMovies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <Film className="h-4 w-4 mr-2" />
                            Top Rated
                          </h4>
                          <div className="space-y-2">
                            {genre.topMovies.map((movie) => (
                              <Link key={movie.id} href={`/title/${movie.id}`}>
                                <div className="flex items-center justify-between p-2 rounded border border-gray-700 hover:border-red-500 transition-colors cursor-pointer">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                      {movie.title}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-400 mt-1">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {movie.year}
                                    </div>
                                  </div>
                                  <div className="flex items-center text-yellow-400 ml-2">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    <span className="text-xs font-medium">{movie.rating}</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explore Button */}
                      <div className="mt-6">
                        <Link href={`/browse?subgenre=${encodeURIComponent(genre.slug)}`}>
                          <Button className="w-full horror-button-primary transition-colors">
                            Explore {genre.name}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
