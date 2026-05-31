import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Validate at module-init time so a missing .env key surfaces as an obvious
// error rather than a mysterious RLS / auth failure deep in a user flow.
// Previously both fell back to '' which silently created a broken client.
if (__DEV__) {
  if (!SUPABASE_URL) {
    console.error('[Supabase] SUPABASE_URL is not set. Add it to your .env file.');
  }
  if (!SUPABASE_ANON_KEY) {
    console.error('[Supabase] SUPABASE_ANON_KEY is not set. Add it to your .env file.');
  }
}

const supabaseUrl = SUPABASE_URL || '';
const supabaseAnonKey = SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
