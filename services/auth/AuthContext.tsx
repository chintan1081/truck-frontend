import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  login as loginApi,
  register as registerApi,
  fetchCurrentUser,
  logout as logoutApi,
} from '../api/auth';
import type { AuthUser, LoginInput, RegisterInput } from '../api/auth';
import { getAuthToken, setUnauthorizedHandler } from '../api/client';

/**
 * Central auth state for the SPA. Holds the current user, bootstraps the session
 * from a persisted token on load, and wires the API client's 401 handler so an
 * expired token cleanly drops the user back to the login screen from anywhere.
 */

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const logout = useCallback(() => {
    logoutApi();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // A 401 from any request means the token is gone/expired — force re-login.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore an existing session from the persisted token on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getAuthToken()) {
        setStatus('unauthenticated');
        return;
      }
      const current = await fetchCurrentUser();
      if (cancelled) return;
      if (current) {
        setUser(current);
        setStatus('authenticated');
      } else {
        logoutApi();
        setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { user: u } = await loginApi(input);
    setUser(u);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: u } = await registerApi(input);
    setUser(u);
    setStatus('authenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    const current = await fetchCurrentUser();
    if (current) setUser(current);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, refreshUser }),
    [status, user, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
