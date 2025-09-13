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

type SortField = 'average_rating' | 'critics_rating' | 'users_rating' | 'release_date';
type SortDir = 'asc' | 'desc';

function splitSort(value: string | undefined): [SortField, SortDir] {
  if (!value) return ['average_rating', 'desc'];
  if (value === 'year_newest') return ['release_date', 'desc'];
  if (value === 'year_oldest') return ['release_date', 'asc'];
  const [fieldRaw, dirRaw] = value.split(':');
  const field: SortField = [
    'average_rating',
    'critics_rating',
    'users_rating',
    'release_date',
  ].includes(fieldRaw as SortField)
    ? (fieldRaw as SortField)
    : 'average_rating';
  const dir: SortDir = ['asc', 'desc'].includes(dirRaw as SortDir) ? (dirRaw as SortDir) : 'desc';
  return [field, dir];
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
  const [sortField, sortDir] = splitSort(sortBy);
  const setSortField = (field: SortField) => onSortChange(`${field}:${sortDir}`);
  const setSortDir = (dir: SortDir) => onSortChange(`${sortField}:${dir}`);

  return (
    <section className="dark-gray-bg py-3 sm:py-6 border-b border-gray-800 relative z-0 mt-2 sm:mt-0">
      <div className="max-w-7xl mx-auto px-6 space-y-4">
        <div className="mb-1 lg:flex lg:items-center lg:gap-3">
          <span className="block mb-2 lg:mb-0 lg:w-28 lg:shrink-0 text-lg font-semibold text-white">
            Filter by:
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:flex-1">
            <Select value={selectedPlatform} onValueChange={onPlatformChange}>
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
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
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
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
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
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
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
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
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
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
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
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

        <div className="mb-1 lg:flex lg:items-center lg:gap-3">
          <span className="block mb-2 lg:mb-0 lg:w-28 lg:shrink-0 text-lg font-semibold text-white">
            Sort by:
          </span>

          <div className="grid grid-cols-2 gap-3 lg:inline-grid lg:grid-flow-col lg:auto-cols-max">
            <Select value={sortField} onValueChange={(v) => setSortField(v as any)}>
              <SelectTrigger className="w-full lg:w-auto lg:min-w-[175px] horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue placeholder="Sort field" className="text-white" />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                <SelectItem value="average_rating">Average Rating</SelectItem>
                <SelectItem value="critics_rating">Critics Rating</SelectItem>
                <SelectItem value="users_rating">Audience Rating</SelectItem>
                <SelectItem value="release_date">Release Date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
              <SelectTrigger className="w-full lg:w-auto lg:min-w-[175px] horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue placeholder="Direction" className="text-white" />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
}
