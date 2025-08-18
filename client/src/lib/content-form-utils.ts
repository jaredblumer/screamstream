const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export const normalizeRating = (n: number | null | undefined) => {
  if (n == null) return null;
  const q = round1(Number(n));
  if (!Number.isFinite(q)) return null;
  const c = clamp(q, 0, 10);
  return c === 0 ? null : c; // <- convert 0 to null
};

export const intOrNull = (n: number | null | undefined) => {
  const i = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : NaN;
  return i > 0 ? i : null;
};

export const ensurePrimary = (selected: string[], primary?: string) => {
  if (primary && selected.includes(primary)) return primary;
  return selected[0] ?? '';
};

export function calculateAverageRating(
  criticScore: number | null | undefined,
  userRating: number | null | undefined
): number | null {
  const normalizedCritic = typeof criticScore === 'number' ? criticScore : null;
  const normalizedUser = typeof userRating === 'number' ? userRating : null;

  const scores = [normalizedCritic, normalizedUser].filter(
    (v): v is number => typeof v === 'number'
  );

  if (scores.length === 0) return null;

  const average = scores.reduce((sum, v) => sum + v, 0) / scores.length;

  return Math.round(average * 10) / 10; // rounded to 1 decimal place
}
