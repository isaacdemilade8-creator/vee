/**
 * context/AuthContext.js
 *
 * Global authentication context providing:
 *  - Current user state
 *  - Login / register / logout actions
 *  - Token persistence across app restarts
 *  - Loading state for initial token check
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AuthAPI } from '../api/services';
import { TokenStorage, setUnauthorizedCallback } from '../api/client';

// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // true on first mount (restoring session)
  const [error, setError]     = useState(null);

  // ── On mount: restore saved token and fetch user ────────────────────────────
  useEffect(() => {
    restoreSession();
  }, []);

  // ── Register logout callback with Axios interceptor ─────────────────────────
  useEffect(() => {
    setUnauthorizedCallback(() => {
      console.warn('Token expired or invalid — logging out');
      logout();
    });
  }, []);

  /**
   * Try to restore a previous session from SecureStore.
   * Called once on app startup.
   */
  const restoreSession = async () => {
    try {
      const savedToken = await TokenStorage.get();
      if (savedToken) {
        setToken(savedToken);
        // Validate the token is still valid by fetching the user
        const res = await AuthAPI.me();
        setUser(res.data.user);
      }
    } catch (err) {
      // Token is invalid or expired — clear it
      await TokenStorage.remove();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new account and log in automatically.
   * @param {object} data - { username, email, password, password_confirmation, full_name }
   */
  const register = useCallback(async (data) => {
    setError(null);
    try {
      const res = await AuthAPI.register(data);
      const { user: newUser, token: newToken } = res.data;

      await TokenStorage.save(newToken);
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      const errors = err.response?.data?.errors || {};
      setError(message);
      return { success: false, message, errors };
    }
  }, []);

  /**
   * Log in with email (or username) and password.
   * @param {object} data - { email, password }
   */
  const login = useCallback(async (data) => {
    setError(null);
    try {
      const res = await AuthAPI.login(data);
      const { user: loggedInUser, token: newToken } = res.data;

      await TokenStorage.save(newToken);
      setToken(newToken);
      setUser(loggedInUser);

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Check your credentials.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  /**
   * Log out the current user.
   */
  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } catch (_) {
      // Even if the API call fails, we still clear local state
    } finally {
      await TokenStorage.remove();
      setToken(null);
      setUser(null);
    }
  }, []);

  /**
   * Update the cached user object (after profile edit).
   * @param {object} updatedUser
   */
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for consuming the auth context.
 * @example
 *   const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
