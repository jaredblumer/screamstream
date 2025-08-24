export function decadeToRange(label: string): { min: number; maxExclusive: number } | null {
  if (!label) return null;
  const m = label.trim().match(/^(\d{4})s$/i); // e.g. "1950s"
  if (!m) return null;
  const start = parseInt(m[1], 10);
  return { min: start, maxExclusive: start + 10 }; // [1950, 1960)
}
