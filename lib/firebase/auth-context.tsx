'use client';

/**
 * Auth Context — 전역 사용자 상태 + Firestore userDoc (집진설비)
 * Firebase 미설정 환경에서도 안전 (user=null, userDoc=null)
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from './config';
import { onAuthChange, signOut as fbSignOut } from './auth';
import { ensureUserDoc, getUserDoc, type UserDoc } from './users';

type AuthContextValue = {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
  refreshUserDoc: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        try {
          const docData = await ensureUserDoc(u.uid, u.email ?? '', u.displayName ?? undefined);
          setUserDoc(docData);
        } catch (e) {
          console.error('[auth-context] userDoc fetch failed:', e);
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    if (!isFirebaseConfigured) return;
    await fbSignOut();
    setUser(null);
    setUserDoc(null);
  };

  const refreshUserDoc = async () => {
    if (!isFirebaseConfigured || !user) return;
    try {
      const docData = await getUserDoc(user.uid);
      setUserDoc(docData);
    } catch (e) {
      console.error('[auth-context] refreshUserDoc failed:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userDoc, loading, configured: isFirebaseConfigured, signOut, refreshUserDoc }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      userDoc: null,
      loading: false,
      configured: false,
      signOut: async () => {},
      refreshUserDoc: async () => {},
    };
  }
  return ctx;
}
