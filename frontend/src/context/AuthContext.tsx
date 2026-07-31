import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { User, DatabaseConnection } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection | null;
  setActiveConnection: (c: DatabaseConnection | null) => void;
  refreshConnections: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection | null>(null);

  const refreshConnections = useCallback(async () => {
    try {
      const data = await api.getConnections();
      setConnections(data);
      setActiveConnection(current => {
        if (current) {
          // Keep current selection if it still exists
          const still = data.find(c => c.id === current.id);
          return still ?? data[0] ?? null;
        }
        return data[0] ?? null;
      });
    } catch {
      // Silently fail — user may not have connections yet
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('insightdb_token');
      if (!token) { setIsLoading(false); return; }
      try {
        const me = await api.getMe();
        setUser(me);
        await refreshConnections();
      } catch {
        localStorage.removeItem('insightdb_token');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshConnections]);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    const me = await api.getMe();
    setUser(me);
    await refreshConnections();
  };

  const register = async (email: string, password: string) => {
    await api.register(email, password);
    await api.login(email, password);
    const me = await api.getMe();
    setUser(me);
    await refreshConnections();
  };

  const logout = () => {
    localStorage.removeItem('insightdb_token');
    setUser(null);
    setConnections([]);
    setActiveConnection(null);
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, connections, activeConnection,
      setActiveConnection, refreshConnections,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
