'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI, tokenStore } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = tokenStore.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const data = await AuthAPI.me();
      const nextUser = data.user || data;
      setUser(nextUser);
      return nextUser;
    } catch {
      tokenStore.remove();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const data = await AuthAPI.login(credentials);
    const token = data.token || data.access_token;
    if (token) tokenStore.set(token);
    const nextUser = data.user || await refreshUser();
    setUser(nextUser);
    return nextUser;
  }, [refreshUser]);

  const register = useCallback(async (payload) => {
    const data = await AuthAPI.register(payload);
    const token = data.token || data.access_token;
    if (token) tokenStore.set(token);
    const nextUser = data.user || await refreshUser();
    setUser(nextUser);
    return nextUser;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } catch {
      // Local logout still needs to happen when the server token is already invalid.
    }
    tokenStore.remove();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser
  }), [user, loading, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
