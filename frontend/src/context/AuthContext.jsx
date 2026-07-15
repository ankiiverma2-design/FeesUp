import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, load the current tutor.
  useEffect(() => {
    let active = true;
    async function load() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/api/auth/me');
        if (active) setTutor(data.tutor);
      } catch {
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const signup = useCallback(async (payload) => {
    const { data } = await api.post('/api/auth/signup', payload);
    setToken(data.token);
    setTutor(data.tutor);
    return data.tutor;
  }, []);

  const login = useCallback(async (payload) => {
    const { data } = await api.post('/api/auth/login', payload);
    setToken(data.token);
    setTutor(data.tutor);
    return data.tutor;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTutor(null);
  }, []);

  const refreshTutor = useCallback(async () => {
    const { data } = await api.get('/api/auth/me');
    setTutor(data.tutor);
    return data.tutor;
  }, []);

  const value = { tutor, loading, signup, login, logout, refreshTutor, isAuthenticated: !!tutor };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
