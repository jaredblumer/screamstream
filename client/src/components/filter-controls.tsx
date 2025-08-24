import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Subgenre, Platform } from '@shared/schema';

interface FilterControlsProps {
  selectedPlatform: string;
  selectedYear: string;
  selectedCriticsRating: string;
  selectedUsersRating: string;
  selectedType: string;
  selectedSubgenre?: string;
  sortBy: string;
  onPlatformChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onCriticsRatingChange: (value: string) => void;
  onUsersRatingChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSubgenreChange?: (value: string) => void;
  onSortChange: (value: string) => void;
}

export default function FilterControls({
  selectedPlatform,
  selectedYear,
  selectedCriticsRating,
  selectedUsersRating,
  selectedType,
  selectedSubgenre = 'all',
  sortBy,
  onPlatformChange,
  onYearChange,
  onCriticsRatingChange,
  onUsersRatingChange,
  onTypeChange,
  onSubgenreChange,
  onSortChange,
}: FilterControlsProps) {
  const { data: subgenres = [] } = useQuery<Subgenre[]>({
    queryKey: ['/api/subgenres'],
    queryFn: async () => {
      const response = await fetch('/api/subgenres');
      if (!response.ok) throw new Error('Failed to load subgenres');
      return response.json();
    },
  });

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ['/api/platforms/with-active-content'],
    queryFn: async () => {
      const res = await fetch('/api/platforms/with-active-content');
      if (!res.ok) throw new Error('Failed to load platforms');
      return res.json();
    },
  });

  type DecadeRow = { decade: number; count: number };

  const { data: decades = [] } = useQuery<DecadeRow[]>({
    queryKey: [
      '/api/decades',
      { platform: selectedPlatform, type: selectedType, subgenre: selectedSubgenre },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPlatform && selectedPlatform !== 'all')
        params.set('platformKey', selectedPlatform);
      if (selectedType && selectedType !== 'all') params.set('type', selectedType);
      if (selectedSubgenre && selectedSubgenre !== 'all') params.set('subgenre', selectedSubgenre);
      const res = await fetch(`/api/decades?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load decades');
      return res.json();
    },
  });

  function decadeLabel(d: number) {
    return `${d}s`;
  }

  const handleSubgenreChange = onSubgenreChange ?? (() => {});

  return (
    <section className="dark-gray-bg py-3 sm:py-6 border-b border-gray-800 relative z-0 mt-2 sm:mt-0">
      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-lg font-semibold text-white min-w-[100px]">Filter by:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-1 lg:flex-wrap gap-3">
                <Select value={selectedPlatform} onValueChange={onPlatformChange}>
                  <SelectTrigger className="w-full lg:flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="All Platforms" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all">All Platforms</SelectItem>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.platformKey}>
                        {p.platformName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSubgenre} onValueChange={handleSubgenreChange}>
                  <SelectTrigger className="w-full lg:flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="All Subgenres" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all">All Subgenres</SelectItem>
                    {subgenres.map((subgenre) => (
                      <SelectItem key={subgenre.slug} value={subgenre.slug}>
                        {subgenre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={onYearChange}>
                  <SelectTrigger className="w-full lg:flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="All Decades" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all">All Decades</SelectItem>
                    {decades.map(({ decade }) => {
                      const label = decadeLabel(decade);
                      return (
                        <SelectItem key={decade} value={label}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select value={selectedCriticsRating} onValueChange={onCriticsRatingChange}>
                  <SelectTrigger className="w-full lg:flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="Critics Rating" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all">Critics Rating</SelectItem>
                    <SelectItem value="9">9.0+ Critics</SelectItem>
                    <SelectItem value="8">8.0+ Critics</SelectItem>
                    <SelectItem value="7">7.0+ Critics</SelectItem>
                    <SelectItem value="6">6.0+ Critics</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedUsersRating} onValueChange={onUsersRatingChange}>
                  <SelectTrigger className="w-full lg:flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="Audience Rating" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all">Audience Rating</SelectItem>
                    <SelectItem value="9">9.0+ Audience</SelectItem>
                    <SelectItem value="8">8.0+ Audience</SelectItem>
                    <SelectItem value="7">7.0+ Audience</SelectItem>
                    <SelectItem value="6">6.0+ Audience</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={onTypeChange}>
                  <SelectTrigger className="w-full lg:flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="All Content" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="series">Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-white">Sort by:</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[140px] horror-bg border-gray-700 text-white horror-select-trigger">
                  <SelectValue placeholder="Sort by" className="text-white" />
                </SelectTrigger>
                <SelectContent className="horror-bg border-gray-700 horror-select-content">
                  <SelectItem value="average_rating">Average Rating</SelectItem>
                  <SelectItem value="critics_rating">Critics Rating</SelectItem>
                  <SelectItem value="users_rating">Audience Rating</SelectItem>
                  <SelectItem value="year_newest">Newest First</SelectItem>
                  <SelectItem value="year_oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
