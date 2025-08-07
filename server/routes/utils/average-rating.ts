export function calculateAverageRating(
  criticScore: number | null | undefined,
  userRating: number | null | undefined
): number | null {
  const normalizedCritic = typeof criticScore === 'number' ? criticScore / 10 : null;
  const normalizedUser = typeof userRating === 'number' ? userRating : null;

  const scores = [normalizedCritic, normalizedUser].filter(
    (v): v is number => typeof v === 'number'
  );

  if (scores.length === 0) return null;

  const average = scores.reduce((sum, v) => sum + v, 0) / scores.length;

  return Math.round(average * 10) / 10; // rounded to 1 decimal place
}
