import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface WatchmodeGenre {
  id: number;
  name: string;
}

interface WatchmodeGenresResponse {
  genres: WatchmodeGenre[];
  horrorRelated: WatchmodeGenre[];
  currentSubgenres: string[];
}

export function WatchmodeGenres() {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<WatchmodeGenresResponse>({
    queryKey: ['/api/admin/watchmode/genres'],
    refetchOnWindowFocus: false,
  });

  const filteredGenres =
    response?.genres?.filter((genre) =>
      genre.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <Card className="horror-bg border-gray-700">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
            <span className="ml-2 text-white">Loading Watchmode genres...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="horror-bg border-gray-700">
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to fetch Watchmode genres</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="horror-bg border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Watchmode API Genres
          </CardTitle>
          <CardDescription className="text-gray-400">
            Official genre list from Watchmode API. Use these genre IDs for content filtering and
            sync operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search genres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-sm text-gray-400">
              Found {filteredGenres.length} of {response?.genres?.length || 0} genres
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="horror-bg border-gray-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredGenres.map((genre) => (
              <Badge
                key={genre.id}
                variant="secondary"
                className="bg-gray-800 text-gray-300 hover:bg-gray-700 p-2 cursor-default flex items-center justify-between"
              >
                <span>{genre.name}</span>
                <span className="text-xs text-gray-500 ml-2">ID: {genre.id}</span>
              </Badge>
            ))}
          </div>

          {filteredGenres.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-400">No genres found matching "{searchTerm}"</p>
            </div>
          )}

          {!response?.genres || response.genres.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No genres available</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {response?.horrorRelated && response.horrorRelated.length > 0 && (
        <Card className="horror-bg border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Horror-Related Genres</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Genres specifically relevant for horror content discovery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {response.horrorRelated.map((genre) => (
                <Badge
                  key={genre.id}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900 p-2 cursor-default flex items-center justify-between"
                >
                  <span>{genre.name}</span>
                  <span className="text-xs text-red-500 ml-2">ID: {genre.id}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {response?.currentSubgenres && response.currentSubgenres.length > 0 && (
        <Card className="horror-bg border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Current Horror Subgenres</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Horror subgenres currently in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {response.currentSubgenres.map((subgenre, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-gray-800 text-orange-300 hover:bg-gray-700 p-1 cursor-default text-xs"
                >
                  {subgenre}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="horror-bg border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">API Usage Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400">
            The Horror genre has ID <strong className="text-red-400">11</strong>. This is used in
            content sync operations to filter for horror titles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
