import { Link } from 'wouter';
import type { HasSubgenres, SubgenreLite } from '@/lib/subgenres';
import { getPrimarySubgenre, getSortedSubgenres } from '@/lib/subgenres';
import { trackEvent } from '@/lib/analytics';

function Chip({ sub }: { sub: SubgenreLite }) {
  const qs = new URLSearchParams({ subgenre: sub.slug }).toString();
  const href = `/browse?${qs}`;
  return (
    <Link
      href={href}
      onClick={() => trackEvent('Navigation', 'subgenre_chip_click', sub.slug)}
      className="blood-red-bg text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600"
      aria-label={`Browse ${sub.name} Titles`}
    >
      {sub.name}
    </Link>
  );
}

export default function SubgenreChips({ item }: { item: HasSubgenres }) {
  const sorted = getSortedSubgenres(item);
  const fallback = getPrimarySubgenre(item);

  // If no subgenres, show a single primary (if present); otherwise show all sorted.
  const toRender = sorted.length > 0 ? sorted : fallback ? [fallback] : [];

  return (
    <div className="flex flex-wrap gap-2">
      {toRender.map((sub) => (
        <Chip key={sub.id ?? sub.slug} sub={sub} />
      ))}
    </div>
  );
}
