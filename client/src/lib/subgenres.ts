export type SubLite = { id: number; name: string; slug: string };

export type HasSubgenres = {
  subgenres?: SubLite[];
  primarySubgenre?: SubLite | null;
  primarySubgenreId?: number | null;
};

/** Find a subgenre by slug from a list. */
export function findSubgenreBySlug(
  subs: SubLite[] | undefined,
  slug?: string | null
): SubLite | undefined {
  if (!subs || !slug || slug === 'all') return undefined;
  return subs.find((s) => s.slug === slug);
}

/** Resolve the primary subgenre, preferring the object, then ID lookup, then first item. */
export function getPrimarySubgenre(item: HasSubgenres): SubLite | undefined {
  if (item.primarySubgenre) return item.primarySubgenre ?? undefined;
  if (item.primarySubgenreId && item.subgenres?.length) {
    return item.subgenres.find((s) => s.id === item.primarySubgenreId);
  }
  return item.subgenres?.[0];
}

/** The single display name to show (selected slug overrides primary). */
export function getDisplaySubgenreName(item: HasSubgenres, selectedSlug?: string): string {
  const selected = findSubgenreBySlug(item.subgenres, selectedSlug);
  if (selected) return selected.name;
  const primary = getPrimarySubgenre(item);
  return primary?.name ?? '';
}

/** Convenience: list of subgenre names for badges, etc. */
export function getSubgenreNames(item: HasSubgenres): string[] {
  return (item.subgenres ?? []).map((s) => s.name);
}

/** Whether a given subgenre is the primary for an item. */
export function isPrimarySubgenre(s: SubLite, item: HasSubgenres): boolean {
  if (item.primarySubgenre?.id != null) return item.primarySubgenre.id === s.id;
  if (item.primarySubgenreId != null) return item.primarySubgenreId === s.id;
  // Fallback: if no primary defined, treat first in list as primary
  const first = item.subgenres?.[0];
  return !!first && first.id === s.id;
}
