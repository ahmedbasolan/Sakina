// ── Validation Utilities ─────────────────────────────────────────────────
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// ── Quran Utilities ──────────────────────────────────────────────────────

/**
 * Extract a verse key (e.g. "2:255") from a source string like
 * "Surah Al-Baqarah 2:255" or "30:4-5".
 * Used to build audio URLs for Quranic recitation.
 */
export const extractVerseKey = (source: string): string => {
  const match = source.match(/(\d+):(\d+(?:-\d+)?)/);
  if (match) return `${match[1]}:${match[2]}`;
  return '';
};

// ── Async Utilities ────────────────────────────────────────────────────────
export const withTimeout = <T>(
  promise: PromiseLike<T>,
  timeoutMs: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};