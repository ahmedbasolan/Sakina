import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
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

// expo-secure-store is capped at 2 KB per key (iOS Keychain limit).
// Supabase sessions exceed that, so we chunk large values across numbered keys.
const CHUNK_SIZE = 1800;

const SecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const chunk0 = await SecureStore.getItemAsync(key);
    if (chunk0 === null) return null;
    // Single-chunk fast path (most keys are small)
    if (!chunk0.startsWith('__chunked__')) return chunk0;
    const count = parseInt(chunk0.replace('__chunked__', ''), 10);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      parts.push((await SecureStore.getItemAsync(`${key}_chunk_${i}`)) ?? '');
    }
    return parts.join('');
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(key, `__chunked__${chunks.length}`);
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}_chunk_${i}`, c)));
  },
  removeItem: async (key: string): Promise<void> => {
    const meta = await SecureStore.getItemAsync(key);
    await SecureStore.deleteItemAsync(key);
    if (meta?.startsWith('__chunked__')) {
      const count = parseInt(meta.replace('__chunked__', ''), 10);
      await Promise.all(
        Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}_chunk_${i}`)),
      );
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
