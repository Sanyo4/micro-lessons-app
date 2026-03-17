import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getAppSettings, createAppSettings, updateAppSettings, resetApp as dbResetApp } from './database';
import { hashPin } from '../utils/pin';

interface AuthContextType {
  isAuthenticated: boolean;
  isNewUser: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  login: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  logout: () => void;
  resetApp: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const settings = await getAppSettings();
      if (!settings) {
        setIsNewUser(true);
        setIsOnboarded(false);
        setIsAuthenticated(false);
      } else {
        setIsNewUser(false);
        setIsOnboarded(settings.onboarding_completed === 1);
      }
    } catch (err) {
      console.error('Auth refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    const settings = await getAppSettings();
    if (!settings?.pin_hash) return false;
    const inputHash = await hashPin(pin);
    if (inputHash === settings.pin_hash) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const setupPin = useCallback(async (pin: string) => {
    const pinHash = await hashPin(pin);
    const settings = await getAppSettings();
    if (settings) {
      await updateAppSettings({ pin_hash: pinHash });
    } else {
      await createAppSettings(pinHash);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const resetApp = useCallback(async () => {
    await dbResetApp();
    setIsAuthenticated(false);
    setIsNewUser(true);
    setIsOnboarded(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isNewUser,
      isOnboarded,
      isLoading,
      login,
      setupPin,
      logout,
      resetApp,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
