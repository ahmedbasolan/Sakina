/**
 * Whether an offering package's product id and an entitlement's
 * productIdentifier name the same store product. Google Play package ids are
 * `<subscriptionId>:<basePlanId>`; entitlements carry the bare subscription
 * id (the base plan is in a separate productPlanIdentifier field). iOS uses
 * the same string on both sides. Compare the part before ':'.
 */
export function sameStoreProduct(packageProductId: string, entitlementProductId: string): boolean {
  return packageProductId.split(':')[0] === entitlementProductId.split(':')[0];
}
