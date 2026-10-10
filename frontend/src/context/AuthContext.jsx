import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then((r) => setUser(r.user)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
      async login(identifier, password) {
        const r = await api.login(identifier, password);
        tokenStore.set(r.token);
        setUser(r.user);
        return r.user;
      },
      // Employee / HR / Finance requests need approval, so they come back as { pending: true, message } without signing in.
      async signup(payload) {
        const r = await api.signup(payload);
        if (r.pending) return r;
        tokenStore.set(r.token);
        setUser(r.user);
        return r;
      },
      // Google ID token → signed in (existing account) or { pending: true, message } (new sign-up awaiting approval).
      async googleLogin(credential, accountType) {
        const r = await api.googleLogin(credential, accountType);
        if (r.pending) return r;
        tokenStore.set(r.token);
        setUser(r.user);
        return r;
      },
    }),
    [user, loading, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
