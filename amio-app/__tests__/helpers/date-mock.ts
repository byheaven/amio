/**
 * Set system date for testing daily-reset logic
 * @param dateString - ISO date string (e.g., '2024-01-15')
 */
export function setMockDate(dateString: string) {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(dateString));
}

/**
 * Restore real timers after test
 */
export function restoreRealTimers() {
  jest.useRealTimers();
}

/**
 * Advance date by N days
 */
export function advanceDateByDays(days: number) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  jest.setSystemTime(future);
}

/**
 * Get current mocked date as YYYY-MM-DD string
 */
export function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
