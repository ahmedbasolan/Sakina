import { supabase } from '../config/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() { }

  async signUpWithEmail(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
    return data;
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  onAuthStateChange(
    callback: (
      event: import('@supabase/supabase-js').AuthChangeEvent,
      session: Session | null,
    ) => void,
  ) {
    const { data } = supabase.auth.onAuthStateChange((event: import('@supabase/supabase-js').AuthChangeEvent, session: Session | null) => {
      callback(event, session);
    });
    return data.subscription;
  }

  async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  /**
   * Permanently deletes the current user's account and all associated data.
   * Required by App Store Review Guidelines 5.1.1.
   * Calls the delete-account Edge Function which uses service_role to cascade
   * the deletion across all user tables.
   */
  async deleteAccount(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please sign in again to delete your account.');

    // supabase.functions.invoke handles token refresh automatically, unlike a
    // raw fetch which would send an expired access_token if getSession() returns
    // a stale session.
    const { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });

    if (error) throw new Error(`Account deletion failed: ${error.message}`);

    // Clear local session only — the account no longer exists server-side so a
    // global signOut round-trip would fail (user not found). scope:'local' skips
    // the network call and just wipes the stored token.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Best-effort: auth listener will still fire and clear local state.
    }
  }
}
