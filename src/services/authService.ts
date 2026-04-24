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
}
