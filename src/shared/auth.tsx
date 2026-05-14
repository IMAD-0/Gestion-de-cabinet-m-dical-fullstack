// ============================================================
// Auth Context — Role-based authentication state via API
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AppUser } from './types';
import { api } from './api';
import { logger } from './logger';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const stored = sessionStorage.getItem('cabinet_session');
    if (stored) {
      return JSON.parse(stored) as AppUser;
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await api.login(email, password);
      setUser(result.user);
      sessionStorage.setItem('cabinet_session', JSON.stringify(result.user));
      logger.info('Login successful', { email, role: result.user.role });
      return { success: true };
    } catch (err) {
      logger.warn('Login failed', { email });
      return { success: false, error: err instanceof Error ? err.message : 'Erreur de connexion' };
    }
  }, []);

  const logout = useCallback(() => {
    logger.info('Logout', { userId: user?.id });
    api.logout();
    setUser(null);
    sessionStorage.removeItem('cabinet_session');
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (user) {
      // In a real app, you'd fetch the latest user info from API
      // For now, we keep it simple
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
