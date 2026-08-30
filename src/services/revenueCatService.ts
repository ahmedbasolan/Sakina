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
  PERIOD_UNIT,
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

export type RCPackageType = 'monthly' | 'yearly' | 'lifetime';

export interface RCPricing {
  monthlyPrice: string; // "$4.99" — store-localized
  yearlyPrice: string; // "$39.99"
  monthlyPriceAmount: number; // 4.99
  yearlyPriceAmount: number; // 39.99
  trialDays: number; // 7
  // Lifetime is OPTIONAL and null whenever the current offering has no
  // Lifetime package. That is the normal state until the non-consumable is
  // live in App Store Connect / Play Console AND attached to the offering in
  // RevenueCat, so every consumer must treat null as "this store has no
  // lifetime plan" and simply not render it — never as an error, and never
  // as a reason to withhold the monthly/annual cards that did load.
  lifetimePrice: string | null; // "AED 400.00"
  lifetimePriceAmount: number | null; // 400
}

/** Convert a store intro-offer period (e.g. 1 × WEEK) into a day count for display. */
function introOfferPeriodToDays(numberOfUnits: number, unit: string): number {
  switch (unit) {
    case PERIOD_UNIT.WEEK:
      return numberOfUnits * 7;
    case PERIOD_UNIT.MONTH:
      return numberOfUnits * 30;
    case PERIOD_UNIT.YEAR:
      return numberOfUnits * 365;
    case PERIOD_UNIT.DAY:
    default:
      return numberOfUnits;
  }
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
  async resolveDurationType(productIdentifier?: string): Promise<'monthly' | 'yearly' | 'lifetime'> {
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
    const matched = offering?.availablePackages.find(
      (p) => p.product.identifier === productIdentifier,
    );
    switch (matched?.packageType) {
      case PACKAGE_TYPE.MONTHLY:
        return 'monthly';
      case PACKAGE_TYPE.LIFETIME:
        return 'lifetime';
      default:
        // Unmatched products keep the long-standing 'yearly' fallback. Note
        // this is a *secondary* path for lifetime: syncFromCustomerInfo
        // identifies a lifetime entitlement from its null expirationDate
        // before ever reaching here, which works offline and after a restore
        // (when no offering is cached). This branch only matters if the
        // entitlement somehow carries an expiry.
        return 'yearly';
    }
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
    // Deliberately NOT part of the guard below: a missing lifetime package
    // must degrade to "no lifetime card", not to "no pricing at all". If this
    // were required, shipping the lifetime UI before the store products were
    // approved would blank the entire paywall — CTA included — for every user.
    const lifetime = offering.availablePackages.find(
      (p) => p.packageType === PACKAGE_TYPE.LIFETIME,
    );

    if (!monthly || !yearly) return null;

    const introOffer = yearly.product.introPrice;

    return {
      monthlyPrice: monthly.product.priceString,
      yearlyPrice: yearly.product.priceString,
      monthlyPriceAmount: monthly.product.price,
      yearlyPriceAmount: yearly.product.price,
      // periodNumberOfUnits is a count in periodUnit's terms (e.g. "1" for a
      // 1-WEEK intro offer) — it was being used directly as a day count,
      // which turned the store's "Free, 1 Week" offer into a UI that told
      // App Review "Start 1-day free trial".
      trialDays: introOffer
        ? introOfferPeriodToDays(introOffer.periodNumberOfUnits, introOffer.periodUnit)
        : 7,
      lifetimePrice: lifetime?.product.priceString ?? null,
      lifetimePriceAmount: lifetime?.product.price ?? null,
    };
  }

  /**
   * Purchase a package — monthly/annual subscription or the one-time lifetime
   * non-consumable. Returns false on user-cancel; throws on all other failures.
   */
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
    const wanted =
      type === 'monthly'
        ? PACKAGE_TYPE.MONTHLY
        : type === 'lifetime'
          ? PACKAGE_TYPE.LIFETIME
          : PACKAGE_TYPE.ANNUAL;
    return offering.availablePackages.find((p) => p.packageType === wanted);
  }
}

export const revenueCat = RevenueCatService.getInstance();
