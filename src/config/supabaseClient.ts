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
// Write order: chunks first, sentinel last (atomic-ish — sentinel is the commit point).
// Delete order: chunks first, sentinel last (sentinel is the pointer; lose it last).
const CHUNK_SIZE = 1800;

const SecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const meta = await SecureStore.getItemAsync(key);
    if (meta === null) return null;
    if (!meta.startsWith('__chunked__')) return meta;
    const count = parseInt(meta.replace('__chunked__', ''), 10);
    // Malformed sentinel (count NaN) — treat as missing rather than returning ''.
    if (isNaN(count) || count <= 0) return null;
    const chunkValues = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}_chunk_${i}`)),
    );
    // If any chunk is missing the session is corrupt — signal absence so auth re-authenticates cleanly.
    if (chunkValues.some((c) => c === null)) return null;
    return chunkValues.join('');
  },

  setItem: async (key: string, value: string): Promise<void> => {
    // Clean up any previously-chunked value stored at this key before writing
    // the new value, so stale chunk keys never linger in the Keychain.
    const existing = await SecureStore.getItemAsync(key);
    if (existing?.startsWith('__chunked__')) {
      const oldCount = parseInt(existing.replace('__chunked__', ''), 10);
      if (!isNaN(oldCount) && oldCount > 0) {
        await Promise.all(
          Array.from({ length: oldCount }, (_, i) =>
            SecureStore.deleteItemAsync(`${key}_chunk_${i}`),
          ),
        );
      }
    }

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    // Write all chunks first; only write the sentinel after all chunks succeed.
    // This way a partial failure leaves no sentinel, so getItem returns null
    // (clean re-auth) rather than a corrupt partial token.
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}_chunk_${i}`, c)));
    await SecureStore.setItemAsync(key, `__chunked__${chunks.length}`);
  },

  removeItem: async (key: string): Promise<void> => {
    const meta = await SecureStore.getItemAsync(key);
    if (meta?.startsWith('__chunked__')) {
      const count = parseInt(meta.replace('__chunked__', ''), 10);
      if (!isNaN(count) && count > 0) {
        // Delete chunks first; only remove the sentinel after all chunks are gone.
        await Promise.all(
          Array.from({ length: count }, (_, i) =>
            SecureStore.deleteItemAsync(`${key}_chunk_${i}`),
          ),
        );
      }
    }
    await SecureStore.deleteItemAsync(key);
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
