import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  driverLogin as loginApi,
  fetchDriverMe,
  driverLogout as logoutApi,
  getDriverToken,
  type DriverProfile,
} from '../driverApi';

type DriverAuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface DriverAuthContextValue {
  status: DriverAuthStatus;
  driver: DriverProfile | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => void;
}

const DriverAuthContext = createContext<DriverAuthContextValue | undefined>(undefined);

export const DriverAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [status, setStatus] = useState<DriverAuthStatus>('loading');

  const logout = useCallback(() => {
    logoutApi();
    setDriver(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getDriverToken()) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const current = await fetchDriverMe();
        if (cancelled) return;
        if (current) {
          setDriver(current);
          setStatus('authenticated');
        } else {
          logoutApi();
          setStatus('unauthenticated');
        }
      } catch {
        if (!cancelled) setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (phoneNumber: string, password: string) => {
    const d = await loginApi(phoneNumber, password);
    setDriver(d);
    setStatus('authenticated');
  }, []);

  const value = useMemo<DriverAuthContextValue>(
    () => ({ status, driver, login, logout }),
    [status, driver, login, logout],
  );

  return <DriverAuthContext.Provider value={value}>{children}</DriverAuthContext.Provider>;
};

export function useDriverAuth(): DriverAuthContextValue {
  const ctx = useContext(DriverAuthContext);
  if (!ctx) {
    throw new Error('useDriverAuth must be used within a DriverAuthProvider');
  }
  return ctx;
}
