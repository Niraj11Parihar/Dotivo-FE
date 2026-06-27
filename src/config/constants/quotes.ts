export const QUOTES_BY_CATEGORY = {
  discipline: [],
  consistency: [],
  mindset: [],
  student: [],
  fitness: [],
  developer: [],
  gratitude: [],
};

// Fallback until backend loads
export const ALL_QUOTES: string[] = ['"Loading your daily momentum..."'];

/**
 * Returns a stable quote for the given day (0-indexed day of month or epoch day)
 */
export function getDailyQuote(dayIndex?: number): string {
  const idx = dayIndex ?? new Date().getDate();
  return ALL_QUOTES[idx % ALL_QUOTES.length];
}
