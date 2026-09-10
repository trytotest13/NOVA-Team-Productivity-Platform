'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch, clearAuthToken, getAuthToken, setAuthToken } from '@/lib/http';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True once the initial token check (/api/auth/me) has resolved. */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Stores a token issued elsewhere (registration, Google callback) and loads the profile. */
  adoptToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setReady(true);
      return;
    }
    apiFetch<AuthUser>('/api/auth/me')
      .then((profile) => setUser(profile))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onUnauthorized = (): void => setUser(null);
    window.addEventListener('nova:unauthorized', onUnauthorized);
    return () => window.removeEventListener('nova:unauthorized', onUnauthorized);
  }, []);

  const adoptToken = useCallback(async (token: string): Promise<void> => {
    setAuthToken(token);
    const profile = await apiFetch<AuthUser>('/api/auth/me');
    setUser(profile);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const result = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback((): void => {
    clearAuthToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, adoptToken, logout }),
    [user, ready, login, adoptToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
