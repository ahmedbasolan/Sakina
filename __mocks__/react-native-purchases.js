// Jest mock for react-native-purchases.
// The real module requires native iOS/Android code that isn't available in Jest.
const Purchases = {
  configure: jest.fn(),
  setLogLevel: jest.fn(),
  getCustomerInfo: jest.fn(() => Promise.resolve({
    entitlements: { active: {} },
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
    latestExpirationDate: null,
  })),
  getOfferings: jest.fn(() => Promise.resolve({ current: null, all: {} })),
  purchasePackage: jest.fn(() => Promise.resolve({
    customerInfo: { entitlements: { active: {} } },
    transaction: {},
  })),
  restorePurchases: jest.fn(() => Promise.resolve({
    entitlements: { active: {} },
  })),
  logIn: jest.fn(() => Promise.resolve({ customerInfo: {}, created: false })),
  logOut: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
};

module.exports = {
  default: Purchases,
  __esModule: true,
  LOG_LEVEL: { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' },
  PACKAGE_TYPE: {
    MONTHLY: 'MONTHLY',
    ANNUAL: 'ANNUAL',
    WEEKLY: 'WEEKLY',
    LIFETIME: 'LIFETIME',
    UNKNOWN: 'UNKNOWN',
    CUSTOM: 'CUSTOM',
    THREE_MONTH: 'THREE_MONTH',
    SIX_MONTH: 'SIX_MONTH',
    TWO_MONTH: 'TWO_MONTH',
  },
  CustomerInfo: {},
  PurchasesOffering: {},
  PurchasesPackage: {},
};
