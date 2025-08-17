import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Film, Star, User, Calendar } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Subgenre } from '@shared/schema';
import type { Content } from '@shared/schema';

interface SubgenreData {
  name: string;
  slug: string;
  description: string;
  count: number;
  topMovies: Content[];
}

export default function Subgenres() {
  const { data: movies = [], isLoading: moviesLoading } = useQuery<Content[]>({
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
    console.log(subgenres);
    return subgenres
      .filter((subgenre) => subgenre.isActive)
      .map((subgenre) => {
        const matchingMovies = movies.filter((movie) =>
          movie.subgenres?.some((s) => s.toLowerCase() === subgenre.slug)
        );

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
          <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-8">
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
        <div className="text-center mx-auto px-6 py-8 sm:py-12 animate-fade-in">
          <div className="mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-white text-center">
              Horror <span className="blood-red">Subgenres</span>
            </h1>
          </div>
          <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto">
            From supernatural scares to psychological thrillers, discover what makes each subgenre
            uniquely terrifying.
          </p>
        </div>

        {/* Genre Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-slide stagger-1 px-6">
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
                <CardDescription className="text-gray-400">{genre.description}</CardDescription>
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
                            {movie.criticsRating && (
                              <div className="flex items-center horror-orange ml-2">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                <span className="text-xs font-medium text-white">
                                  {movie.criticsRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                            {movie.usersRating && (
                              <div className="flex items-center text-red-400 ml-2">
                                <User className="h-3 w-3 mr-1 fill-current" />
                                <span className="text-xs font-medium text-white">
                                  {movie.usersRating.toFixed(1)}
                                </span>
                              </div>
                            )}
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

        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center p-8 rounded-lg border border-gray-700 dark-gray-bg animate-slide-up stagger-2">
            <h3 className="text-2xl font-bold text-white mb-4">Find Your Next Fright</h3>
            <p className="text-gray-300 mb-6">
              Discover cult classics, hidden gems, and spine-chilling surprises lurking below the
              surface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse">
                <Button className="horror-button-primary">Browse More Movies</Button>
              </Link>
              <Link href="/watchlist">
                <Button variant="outline" className="horror-button-outline">
                  View Watchlist
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
