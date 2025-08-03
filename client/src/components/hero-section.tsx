import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onViewTopRanked: () => void;
  onBrowseGenres: () => void;
  onNewToStreaming: () => void;
}

export default function HeroSection({
  onViewTopRanked,
  onBrowseGenres,
  onNewToStreaming,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[500px] horror-bg flex items-center">
      {/* Dark atmosphere overlay */}
      <div className="absolute inset-0 bg-black/50 z-10"></div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-8 sm:px-10 lg:px-12 py-8">
        <div className="max-w-2xl text-center sm:text-left mx-auto sm:mx-0">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-thin text-white mb-4 animate-float leading-tight break-words">
            Top Rated
            <span className="blood-red font-bold block">Streaming Horror</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Discover the highest-rated horror movies and series currently streaming. Rated by
            critics and audiences across all major platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onViewTopRanked}
              className="horror-button-primary px-8 py-3 font-semibold animate-glow relative z-10 w-full sm:w-auto"
            >
              View Top Rated
            </Button>
            <Button
              onClick={onNewToStreaming}
              variant="outline"
              className="horror-button-outline px-8 py-3 font-semibold relative z-10 w-full sm:w-auto"
            >
              New to Streaming
            </Button>
            <Button
              onClick={onBrowseGenres}
              variant="outline"
              className="horror-button-outline px-8 py-3 font-semibold relative z-10 w-full sm:w-auto"
            >
              Browse Subgenres
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
