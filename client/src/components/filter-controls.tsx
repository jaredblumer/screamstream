import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Subgenre } from "@shared/schema";

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
  showSubgenreFilter?: boolean;
}

export default function FilterControls({
  selectedPlatform,
  selectedYear,
  selectedCriticsRating,
  selectedUsersRating,
  selectedType,
  selectedSubgenre = "all",
  sortBy,
  onPlatformChange,
  onYearChange,
  onCriticsRatingChange,
  onUsersRatingChange,
  onTypeChange,
  onSubgenreChange,
  onSortChange,
  showSubgenreFilter = false,
}: FilterControlsProps) {
  
  const { data: subgenres = [], isLoading: subgenresLoading } = useQuery<Subgenre[]>({
    queryKey: ["/api/subgenres"],
  });

  return (
    <section className="dark-gray-bg py-3 sm:py-6 border-b border-gray-800 relative z-0 mb-2 mt-2 sm:mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3 lg:mb-0">
              <span className="text-lg font-semibold text-white lg:min-w-[100px]">Filter by:</span>
              <div className="hidden lg:flex lg:flex-1 lg:gap-3">
                {/* Platform Filter - Large screens inline */}
                <Select value={selectedPlatform} onValueChange={onPlatformChange}>
                  <SelectTrigger className="flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="All Platforms" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all" className="horror-select-item">All Platforms</SelectItem>
                    <SelectItem value="netflix" className="horror-select-item">Netflix</SelectItem>
                    <SelectItem value="hulu" className="horror-select-item">Hulu</SelectItem>
                    <SelectItem value="amazon_prime" className="horror-select-item">Amazon Prime</SelectItem>
                    <SelectItem value="hbo_max" className="horror-select-item">HBO Max</SelectItem>
                  </SelectContent>
                </Select>

                {/* Subgenre Filter - Large screens inline */}
                {showSubgenreFilter && onSubgenreChange && (
                  <Select value={selectedSubgenre} onValueChange={onSubgenreChange}>
                    <SelectTrigger className="flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                      <SelectValue placeholder="All Subgenres" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="horror-bg border-gray-700 horror-select-content">
                      {subgenres.map((subgenre) => (
                        <SelectItem key={subgenre.slug} value={subgenre.slug} className="horror-select-item">
                          {subgenre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Decade Filter - Large screens inline */}
                <Select value={selectedYear} onValueChange={onYearChange}>
                  <SelectTrigger className="flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="All Decades" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all" className="horror-select-item">All Decades</SelectItem>
                    <SelectItem value="2020s" className="horror-select-item">2020s</SelectItem>
                    <SelectItem value="2010s" className="horror-select-item">2010s</SelectItem>
                    <SelectItem value="2000s" className="horror-select-item">2000s</SelectItem>
                    <SelectItem value="1990s" className="horror-select-item">1990s</SelectItem>
                    <SelectItem value="1980s" className="horror-select-item">1980s</SelectItem>
                    <SelectItem value="1970s" className="horror-select-item">1970s</SelectItem>
                    <SelectItem value="1960s" className="horror-select-item">1960s</SelectItem>
                  </SelectContent>
                </Select>

                {/* Critics Rating Filter - Large screens inline */}
                <Select value={selectedCriticsRating} onValueChange={onCriticsRatingChange}>
                  <SelectTrigger className="flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="Critics Rating" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all" className="horror-select-item">Critic Rating</SelectItem>
                    <SelectItem value="9" className="horror-select-item">9.0+ Critics</SelectItem>
                    <SelectItem value="8" className="horror-select-item">8.0+ Critics</SelectItem>
                    <SelectItem value="7" className="horror-select-item">7.0+ Critics</SelectItem>
                    <SelectItem value="6" className="horror-select-item">6.0+ Critics</SelectItem>
                  </SelectContent>
                </Select>

                {/* Users Rating Filter - Large screens inline */}
                <Select value={selectedUsersRating} onValueChange={onUsersRatingChange}>
                  <SelectTrigger className="flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="Users Rating" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all" className="horror-select-item">User Rating</SelectItem>
                    <SelectItem value="9" className="horror-select-item">9.0+ Users</SelectItem>
                    <SelectItem value="8" className="horror-select-item">8.0+ Users</SelectItem>
                    <SelectItem value="7" className="horror-select-item">7.0+ Users</SelectItem>
                    <SelectItem value="6" className="horror-select-item">6.0+ Users</SelectItem>
                  </SelectContent>
                </Select>

                {/* Content Type Filter - Large screens inline */}
                <Select value={selectedType} onValueChange={onTypeChange}>
                  <SelectTrigger className="flex-1 horror-bg border-gray-700 text-white horror-select-trigger">
                    <SelectValue placeholder="All Content" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="horror-bg border-gray-700 horror-select-content">
                    <SelectItem value="all" className="horror-select-item">All Content</SelectItem>
                    <SelectItem value="movie" className="horror-select-item">Movies</SelectItem>
                    <SelectItem value="series" className="horror-select-item">TV Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Mobile/Tablet Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-3">
              {/* Platform Filter */}
            <Select value={selectedPlatform} onValueChange={onPlatformChange}>
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue placeholder="All Platforms" className="text-white" />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                <SelectItem value="all" className="horror-select-item">All Platforms</SelectItem>
                <SelectItem value="netflix" className="horror-select-item">Netflix</SelectItem>
                <SelectItem value="hulu" className="horror-select-item">Hulu</SelectItem>
                <SelectItem value="amazon_prime" className="horror-select-item">Amazon Prime</SelectItem>
                <SelectItem value="hbo_max" className="horror-select-item">HBO Max</SelectItem>
              </SelectContent>
            </Select>

            {/* Subgenre Filter - only show when enabled */}
            {showSubgenreFilter && onSubgenreChange && (
              <Select value={selectedSubgenre} onValueChange={onSubgenreChange}>
                <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
                  <SelectValue placeholder="All Subgenres" className="text-white" />
                </SelectTrigger>
                <SelectContent className="horror-bg border-gray-700 horror-select-content">
                  <SelectItem value="all" className="horror-select-item">All Subgenres</SelectItem>
                  <SelectItem value="slasher" className="horror-select-item">Slasher</SelectItem>
                  <SelectItem value="supernatural" className="horror-select-item">Supernatural</SelectItem>
                  <SelectItem value="psychological" className="horror-select-item">Psychological</SelectItem>
                  <SelectItem value="body horror" className="horror-select-item">Body Horror</SelectItem>
                  <SelectItem value="folk horror" className="horror-select-item">Folk Horror</SelectItem>
                  <SelectItem value="cosmic horror" className="horror-select-item">Cosmic Horror</SelectItem>
                  <SelectItem value="zombie" className="horror-select-item">Zombie</SelectItem>
                  <SelectItem value="vampire" className="horror-select-item">Vampire</SelectItem>
                  <SelectItem value="werewolf" className="horror-select-item">Werewolf</SelectItem>
                  <SelectItem value="found footage" className="horror-select-item">Found Footage</SelectItem>
                  <SelectItem value="anthology" className="horror-select-item">Anthology</SelectItem>
                  <SelectItem value="gothic" className="horror-select-item">Gothic</SelectItem>
                  <SelectItem value="monster" className="horror-select-item">Monster</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Decade Filter */}
            <Select value={selectedYear} onValueChange={onYearChange}>
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue placeholder="All Decades" className="text-white" />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                <SelectItem value="all" className="horror-select-item">All Decades</SelectItem>
                <SelectItem value="2020s" className="horror-select-item">2020s</SelectItem>
                <SelectItem value="2010s" className="horror-select-item">2010s</SelectItem>
                <SelectItem value="2000s" className="horror-select-item">2000s</SelectItem>
                <SelectItem value="1990s" className="horror-select-item">1990s</SelectItem>
                <SelectItem value="1980s" className="horror-select-item">1980s</SelectItem>
                <SelectItem value="1970s" className="horror-select-item">1970s</SelectItem>
                <SelectItem value="1960s" className="horror-select-item">1960s</SelectItem>
              </SelectContent>
            </Select>

            {/* Critics Rating Filter */}
            <Select value={selectedCriticsRating} onValueChange={onCriticsRatingChange}>
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue placeholder="Critics Rating" className="text-white" />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                <SelectItem value="all" className="horror-select-item">Critic Rating</SelectItem>
                <SelectItem value="9" className="horror-select-item">9.0+ Critics</SelectItem>
                <SelectItem value="8" className="horror-select-item">8.0+ Critics</SelectItem>
                <SelectItem value="7" className="horror-select-item">7.0+ Critics</SelectItem>
                <SelectItem value="6" className="horror-select-item">6.0+ Critics</SelectItem>
              </SelectContent>
            </Select>

            {/* Users Rating Filter */}
            <Select value={selectedUsersRating} onValueChange={onUsersRatingChange}>
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue placeholder="Users Rating" className="text-white" />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                <SelectItem value="all" className="horror-select-item">User Rating</SelectItem>
                <SelectItem value="9" className="horror-select-item">9.0+ Users</SelectItem>
                <SelectItem value="8" className="horror-select-item">8.0+ Users</SelectItem>
                <SelectItem value="7" className="horror-select-item">7.0+ Users</SelectItem>
                <SelectItem value="6" className="horror-select-item">6.0+ Users</SelectItem>
              </SelectContent>
            </Select>

            {/* Content Type Filter */}
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-full horror-bg border-gray-700 text-white horror-select-trigger">
                <SelectValue placeholder="All Content" className="text-white" />
              </SelectTrigger>
              <SelectContent className="horror-bg border-gray-700 horror-select-content">
                <SelectItem value="all" className="horror-select-item">All Content</SelectItem>
                <SelectItem value="movie" className="horror-select-item">Movies</SelectItem>
                <SelectItem value="series" className="horror-select-item">TV Series</SelectItem>
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
                <SelectItem value="rating" className="horror-select-item">Rating</SelectItem>
                <SelectItem value="critics_rating" className="horror-select-item">Critics Rating</SelectItem>
                <SelectItem value="users_rating" className="horror-select-item">Users Rating</SelectItem>
                <SelectItem value="year_newest" className="horror-select-item">Newest First</SelectItem>
                <SelectItem value="year_oldest" className="horror-select-item">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
}
