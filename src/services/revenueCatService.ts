/**
 * RevenueCatService — thin wrapper around the react-native-purchases SDK.
 *
 * Single place for all RC calls; subscriptionService.ts delegates here for
 * any actual purchase/restore/entitlement work. This keeps the rest of the
 * codebase decoupled from the RC SDK surface.
 *
 * SDK keys are PUBLIC (safe to ship in the binary — RC docs confirm this).
 * Replace the placeholder strings below with the keys from:
 *   app.revenuecat.com → Project: Sakina → API keys
 *   → "App specific keys" section → iOS / Android public key
 */
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
  PACKAGE_TYPE,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// ─── SDK keys ──────────────────────────────────────────────────────────────
// Test Store key — works for both platforms during development/sandbox testing.
// When you add real App Store / Play Store app configs in RC, replace these
// with the platform-specific appl_ / goog_ keys from:
//   app.revenuecat.com → Project: Sakina → API keys → SDK API keys
const TEST_STORE_KEY = 'test_VUODgTDnxGTYIBCxcJMaHVAqGTW';
const IOS_API_KEY = TEST_STORE_KEY; // swap for appl_xxxxx when App Store app is added
const ANDROID_API_KEY = TEST_STORE_KEY; // swap for goog_xxxxx when Play Store app is added
// ───────────────────────────────────────────────────────────────────────────

// RC entitlement identifier — must match exactly what's in the RC dashboard.
export const RC_ENTITLEMENT_ID = 'Sakina Pro';

export type RCPackageType = 'monthly' | 'yearly';

export interface RCPricing {
  monthlyPrice: string; // "$4.99" — store-localized
  yearlyPrice: string; // "$39.99"
  monthlyPriceAmount: number; // 4.99
  yearlyPriceAmount: number; // 39.99
  trialDays: number; // 7
}

class RevenueCatService {
  private static instance: RevenueCatService;
  private configured = false;
  private cachedOffering: PurchasesOffering | null = null;

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  /** Call once at app start (before any other RC methods). */
  configure(userId?: string | null) {
    if (this.configured) return;
    const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey, appUserID: userId ?? null });
    this.configured = true;
  }

  /** Fetch the customer's current entitlement info from RC (cached locally). */
  async getCustomerInfo(): Promise<CustomerInfo> {
    return Purchases.getCustomerInfo();
  }

  /** True if the 'premium' entitlement is currently active. */
  isEntitlementActive(info: CustomerInfo): boolean {
    return !!info.entitlements.active[RC_ENTITLEMENT_ID];
  }

  /** Fetch the current RC offering and cache it. */
  async getOffering(): Promise<PurchasesOffering | null> {
    if (this.cachedOffering) return this.cachedOffering;
    const offerings = await Purchases.getOfferings();
    this.cachedOffering = offerings.current;
    return this.cachedOffering;
  }

  /** Extract store-localized prices from the current offering. */
  async getPricing(): Promise<RCPricing | null> {
    const offering = await this.getOffering();
    if (!offering) return null;

    const monthly = offering.availablePackages.find(
      (p) => p.packageType === PACKAGE_TYPE.MONTHLY,
    );
    const yearly = offering.availablePackages.find(
      (p) => p.packageType === PACKAGE_TYPE.ANNUAL,
    );

    if (!monthly || !yearly) return null;

    const introOffer = yearly.product.introPrice;

    return {
      monthlyPrice: monthly.product.priceString,
      yearlyPrice: yearly.product.priceString,
      monthlyPriceAmount: monthly.product.price,
      yearlyPriceAmount: yearly.product.price,
      trialDays: introOffer?.periodNumberOfUnits ?? 7,
    };
  }

  /** Purchase a subscription package. Throws if user cancels. */
  async purchasePackage(type: RCPackageType): Promise<{
    success: boolean;
    customerInfo: CustomerInfo | null;
  }> {
    const offering = await this.getOffering();
    if (!offering) return { success: false, customerInfo: null };

    const pkg = this.findPackage(offering, type);
    if (!pkg) return { success: false, customerInfo: null };

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { success: this.isEntitlementActive(customerInfo), customerInfo };
    } catch (e: any) {
      if (e.userCancelled) return { success: false, customerInfo: null };
      throw e;
    }
  }

  /** Restore previous purchases (required by App Store guidelines). */
  async restorePurchases(): Promise<CustomerInfo> {
    return Purchases.restorePurchases();
  }

  /** Associate the RC anonymous ID with a known user. Call on sign-in. */
  async logIn(userId: string): Promise<void> {
    await Purchases.logIn(userId);
  }

  /** Revert to anonymous ID on sign-out. */
  async logOut(): Promise<void> {
    await Purchases.logOut();
  }

  private findPackage(
    offering: PurchasesOffering,
    type: RCPackageType,
  ): PurchasesPackage | undefined {
    return offering.availablePackages.find((p) =>
      type === 'monthly' ? p.packageType === PACKAGE_TYPE.MONTHLY : p.packageType === PACKAGE_TYPE.ANNUAL,
    );
  }
}

export const revenueCat = RevenueCatService.getInstance();
