import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "checking" mientras se valida con la API el token guardado: evita parpadear el login.
  const [checking, setChecking] = useState(() => Boolean(api.tokenStore.get()));
  const [sessionNotice, setSessionNotice] = useState('');

  const logout = useCallback((notice = '') => {
    api.setSessionToken(null);
    setUser(null);
    setSessionNotice(typeof notice === 'string' ? notice : '');
  }, []);

  // Si la API responde 401 en cualquier momento, se cierra la sesión.
  useEffect(() => {
    api.setUnauthorizedHandler(() => logout('Tu sesión terminó. Inicia sesión de nuevo.'));
    return () => api.setUnauthorizedHandler(() => {});
  }, [logout]);

  // Al abrir la app: si hay token guardado, se confirma que siga siendo válido.
  useEffect(() => {
    const saved = api.tokenStore.get();
    if (!saved) return undefined;

    let cancelled = false;
    api.setSessionToken(saved);
    api.getMe()
      .then((info) => { if (!cancelled) setUser(info); })
      .catch((err) => {
        if (cancelled) return;
        // Solo se descarta el token si la API lo rechazó; si es un fallo de red se conserva.
        if (err?.response?.status === 401) api.setSessionToken(null);
      })
      .finally(() => { if (!cancelled) setChecking(false); });

    return () => { cancelled = true; };
  }, []);

  const applyAuth = useCallback((res) => {
    api.setSessionToken(res.token);
    setSessionNotice('');
    setUser(res.user);
    return res.user;
  }, []);

  const signIn = useCallback(async (email, password) => applyAuth(await api.login(email, password)), [applyAuth]);
  const signUp = useCallback(async (payload) => applyAuth(await api.register(payload)), [applyAuth]);

  const value = useMemo(
    () => ({ user, checking, sessionNotice, signIn, signUp, logout }),
    [user, checking, sessionNotice, signIn, signUp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
};
