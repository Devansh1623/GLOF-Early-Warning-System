import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithFailover } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  // Token may live in either storage — check both on mount.
  const [token, setToken]   = useState(
    () => localStorage.getItem('glof_token') || sessionStorage.getItem('glof_token')
  );
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('glof_token');
    sessionStorage.removeItem('glof_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({ email: payload.sub, role: payload.role, name: payload.name });
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [token, logout]);

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, [logout]);

  /** Persist token in localStorage (remember=true) or sessionStorage (remember=false). */
  const _storeToken = (tok, remember) => {
    if (remember) {
      localStorage.setItem('glof_token', tok);
      sessionStorage.removeItem('glof_token');
    } else {
      sessionStorage.setItem('glof_token', tok);
      localStorage.removeItem('glof_token');
    }
  };

  const login = async (email, password, rememberMe = false) => {
    const res = await fetchWithFailover('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    _storeToken(data.token, rememberMe);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Register then immediately log in — a single extra round-trip
   * (register returns no token, so we must login after).
   */
  const register = async (email, password, name, rememberMe = false) => {
    const res = await fetchWithFailover('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    // Immediately log in — returns full user + token
    return login(email, password, rememberMe);
  };

  const forgotPassword = async (email) => {
    const res = await fetchWithFailover('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request password reset');
    return data;
  };

  const resetPassword = async (email, code, password) => {
    const res = await fetchWithFailover('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
