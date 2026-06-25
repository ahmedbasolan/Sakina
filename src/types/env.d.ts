declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const POSTHOG_API_KEY: string;
  // QURAN_API OAuth2 credentials are intentionally excluded here.
  // OAuth2 client_secrets are server-side credentials and must never be
  // bundled into the app binary. Quran API calls must be proxied through
  // a Supabase Edge Function that holds the secret server-side only.
  export const REVENUECAT_ANDROID_API_KEY: string;
  export const REVENUECAT_IOS_API_KEY: string;
}
