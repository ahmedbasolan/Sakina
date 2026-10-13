/**
 * When this person first held Sakina Pro, from RevenueCat's entitlement
 * `originalPurchaseDateMillis`. Undefined whenever it is absent or not a real
 * time, so the supporter view omits the line instead of printing
 * "Invalid Date" or "Jan 1, 1970". Kept in memory only (see the spec).
 */
export function supporterSinceMs(
  entitlement: { originalPurchaseDateMillis?: number | null } | undefined,
): number | undefined {
  const ms = entitlement?.originalPurchaseDateMillis;
  return typeof ms === 'number' && Number.isFinite(ms) && ms > 0 ? ms : undefined;
}
