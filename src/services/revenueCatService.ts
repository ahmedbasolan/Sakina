/**
 * RevenueCatService — thin wrapper around the react-native-purchases SDK.
 *
 * Single place for all RC calls; subscriptionService.ts delegates here for
 * any actual purchase/restore/entitlement work. This keeps the rest of the
 * codebase decoupled from the RC SDK surface.
 *
 * SDK keys are PUBLIC (safe to ship in the binary — RC docs confirm this) and
 * are loaded from .env (REVENUECAT_IOS_API_KEY / REVENUECAT_ANDROID_API_KEY),
 * never hardcoded. Get them from:
 *   app.revenuecat.com → Project: Sakina → API keys → SDK API keys
 *   (iOS key starts with appl_  |  Android key starts with goog_)
 */
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
  PACKAGE_TYPE,
  INTRO_ELIGIBILITY_STATUS,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_ANDROID_API_KEY, REVENUECAT_IOS_API_KEY } from '@env';

// ─── SDK keys ──────────────────────────────────────────────────────────────
// Keys are loaded from .env (never hardcoded). Get them from:
//   app.revenuecat.com → Project: Sakina → API keys → SDK API keys
//   iOS key starts with appl_  |  Android key starts with goog_
const IOS_API_KEY = REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY = REVENUECAT_ANDROID_API_KEY;
// ───────────────────────────────────────────────────────────────────────────

// RC entitlement identifier — must match exactly what's in the RC dashboard.
const RC_ENTITLEMENT_ID = 'Sakina Pro';

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
  // Set to true when configure() fails due to the native module being absent
  // (Expo Go, simulator without a dev build, etc.). Once flagged we stop
  // retrying — the module won't appear at runtime — and all purchase methods
  // return graceful no-ops instead of throwing SDK errors.
  private nativeUnavailable = false;
  private cachedOffering: PurchasesOffering | null = null;

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  /** True only when the native module is present and Purchases is configured. */
  get isReady(): boolean {
    return this.configured;
  }

  /** Call once at app start (before any other RC methods). */
  configure(userId?: string | null) {
    if (this.configured || this.nativeUnavailable) return;
    try {
      const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
      Purchases.configure({ apiKey, appUserID: userId ?? null });
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      this.configured = true;
    } catch (error: any) {
      const msg: string = error?.message ?? String(error);
      if (msg.includes('Native module') || msg.includes('RNPurchases') || msg.includes('not found')) {
        this.nativeUnavailable = true;
        console.warn('[RevenueCat] Native module unavailable — purchases require a dev/production build, not Expo Go.');
      } else {
        console.warn('[RevenueCat] configure failed:', error);
      }
    }
  }

  /** Fetch the customer's current entitlement info from RC (cached locally). */
  async getCustomerInfo(): Promise<CustomerInfo> {
    this.configure();
    if (!this.configured) throw new Error('RevenueCat native module not available');
    return Purchases.getCustomerInfo();
  }

  /** True if the Sakina Pro entitlement is currently active. */
  isEntitlementActive(info: CustomerInfo): boolean {
    return !!info.entitlements.active[RC_ENTITLEMENT_ID];
  }

  /** The active Sakina Pro entitlement (period type, expiry, etc.), or undefined. */
  getActiveEntitlement(info: CustomerInfo) {
    return info.entitlements.active[RC_ENTITLEMENT_ID];
  }

  /**
   * Resolve a purchased product identifier to its billing duration by matching
   * against the current offering's packages. RC's `periodType` describes the
   * phase (trial/normal), not the duration — this is the reliable source for
   * monthly-vs-yearly. Falls back to 'yearly' when the product can't be matched.
   */
  async resolveDurationType(productIdentifier?: string): Promise<'monthly' | 'yearly'> {
    this.configure();
    if (!this.configured || !productIdentifier) return 'yearly';
    // getOffering() hits the network when nothing is cached yet (e.g. right
    // after restorePurchases(), which unlike purchasePackage() never primes
    // the cache). A transient failure here must not propagate — the caller
    // (syncFromCustomerInfo) hasn't recorded the entitlement RC already
    // confirmed is active, so throwing would tell an entitled user "restore
    // failed" and leave them gated as free. Fall back to 'yearly', the same
    // fallback already used below when the product can't be matched.
    let offering: PurchasesOffering | null = null;
    try {
      offering = await this.getOffering();
    } catch (error) {
      console.warn('[RevenueCat] resolveDurationType: getOffering failed, defaulting to yearly:', error);
      return 'yearly';
    }
    const monthly = offering?.availablePackages.find(
      (p) => p.packageType === PACKAGE_TYPE.MONTHLY,
    );
    return monthly?.product.identifier === productIdentifier ? 'monthly' : 'yearly';
  }

  /**
   * Whether the user is eligible for the intro free trial on the yearly product.
   * Returns false when there's no offering/product or the check fails — callers
   * should then show a plain "Subscribe" CTA instead of promising a free trial
   * (App Store guideline: don't offer a trial to ineligible users).
   */
  async isYearlyTrialEligible(): Promise<boolean> {
    this.configure();
    if (!this.configured) return false;
    const offering = await this.getOffering();
    const yearly = offering?.availablePackages.find(
      (p) => p.packageType === PACKAGE_TYPE.ANNUAL,
    );
    const productId = yearly?.product.identifier;
    if (!productId) return false;
    try {
      const result = await Purchases.checkTrialOrIntroductoryPriceEligibility([productId]);
      return (
        result[productId]?.status ===
        INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
      );
    } catch {
      return false;
    }
  }

  /** Fetch the current RC offering and cache it. */
  async getOffering(): Promise<PurchasesOffering | null> {
    this.configure();
    if (!this.configured) return null;
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

  /** Purchase a subscription package. Returns false on user-cancel; throws on all other failures. */
  async purchasePackage(type: RCPackageType): Promise<{
    success: boolean;
    customerInfo: CustomerInfo | null;
  }> {
    this.configure();
    if (!this.configured) return { success: false, customerInfo: null };
    const offering = await this.getOffering();
    // No offering = RC misconfiguration or network failure — throw so the caller
    // can show an alert rather than silently re-enabling the button.
    if (!offering) throw new Error('No subscription offerings available. Please check your connection and try again.');
    const pkg = this.findPackage(offering, type);
    if (!pkg) throw new Error(`The ${type} package was not found. Please contact support.`);

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
    this.configure();
    if (!this.configured) throw new Error('RevenueCat native module not available');
    return Purchases.restorePurchases();
  }

  /** Associate the RC anonymous ID with a known user. Call on sign-in. */
  async logIn(userId: string): Promise<void> {
    this.configure();
    if (!this.configured) return;
    await Purchases.logIn(userId);
  }

  /** Revert to anonymous ID on sign-out. */
  async logOut(): Promise<void> {
    this.configure();
    if (!this.configured) return;
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
