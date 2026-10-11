export function increment(score: number): number {
  if (!Number.isSafeInteger(score) || score < 0) throw new RangeError('Invalid score');
  return score + 1;
}
