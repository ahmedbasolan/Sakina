// Reads the Pro verdict out of a RevenueCat REST v1 `GET /subscribers/{app_user_id}`
// response. Pure and import-free: the Deno dispatcher and the Jest suite load this
// exact file.
//
// Read from RevenueCat's docs (fetched 2026-11-02):
//   https://www.revenuecat.com/docs/api-v1/customers.md — "Get or Create Customer",
//     `GET https://api.revenuecat.com/v1/subscribers/{app_user_id}`, BearerAuth,
//     200 (found) / 201 (created) both return Customer Info.
//   https://www.revenuecat.com/docs/redocusaurus/openapi-v1-customer-info-model.yaml —
//     `subscriber.entitlements`: "Dictionary of the entitlements of this Customer
//     (including any expired entitlements)"; per entitlement `expires_date` "may be in
//     the past. `null` if it is a lifetime entitlement", and
//     `grace_period_expires_date` "`null` if the Customer has never been in a grace
//     period".
//   https://www.revenuecat.com/docs/subscription-guidance/how-grace-periods-work.md —
//     "subscriptions that are currently in a grace period will still be considered
//     'active'".
//
// Returns null — "unknown", never "not Pro" — when the body is not shaped as
// documented, so the caller treats it like an outage instead of deleting a row.

export const PRO_ENTITLEMENT_ID = 'Sakina Pro';

// Epoch seconds of an ISO date, null for JSON null, undefined when unreadable.
function seconds(v: unknown): number | null | undefined {
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? ms / 1000 : undefined;
}

export function proFromSubscriber(body: unknown, nowSeconds: number): boolean | null {
  const subscriber = (body as { subscriber?: unknown } | null)?.subscriber;
  if (!subscriber || typeof subscriber !== 'object') return null;
  const entitlements = (subscriber as { entitlements?: unknown }).entitlements;
  if (!entitlements || typeof entitlements !== 'object') return null;

  const pro = (entitlements as Record<string, unknown>)[PRO_ENTITLEMENT_ID];
  if (pro === undefined) return false;
  if (!pro || typeof pro !== 'object') return null;

  const expires = seconds((pro as { expires_date?: unknown }).expires_date);
  if (expires === undefined) return null;
  if (expires === null || expires > nowSeconds) return true;

  const grace = (pro as { grace_period_expires_date?: unknown }).grace_period_expires_date;
  if (grace === undefined || grace === null) return false;
  const graceEnds = seconds(grace);
  if (graceEnds === undefined) return null;
  return graceEnds !== null && graceEnds > nowSeconds;
}
