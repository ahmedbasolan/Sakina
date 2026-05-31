import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/authService';
import { SupabaseDataService } from '../services/supabaseDataService';
import { STORAGE_KEYS } from '../constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const authService = AuthService.getInstance();
  const hasMigrated = useRef(false);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const currentSession = await authService.getCurrentSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Fix: if no Supabase session, check whether the user already completed
        // onboarding as a guest. Without this, every cold restart drops them back
        // to the onboarding flow because isGuest is initialised to false.
        if (!currentSession) {
          const onboardingDone = await AsyncStorage.getItem(STORAGE_KEYS.onboarding);
          if (onboardingDone === 'true') {
            setIsGuest(true);
          }
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setIsGuest(false);

        // One-time migration: sync guest data to Supabase on first sign-in
        if (!hasMigrated.current) {
          hasMigrated.current = true;
          SupabaseDataService.getInstance()
            .migrateGuestDataToSupabase()
            .then(({ migratedCount }) => {
              if (migratedCount > 0) {
                console.log(`[Auth] Migrated ${migratedCount} guest history entries to Supabase`);
              }
            })
            .catch((err) => console.error('[Auth] Guest migration error:', err));
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setIsGuest(false);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const enterGuestMode = () => {
    setIsGuest(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, isGuest, loading, signOut, enterGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
