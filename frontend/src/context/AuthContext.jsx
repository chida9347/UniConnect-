import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY } from '../services/api';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const profile = await authService.me();
        if (active) setUser(profile);
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setInitializing(false);
      }
    }
    restoreSession();
    return () => {
      active = false;
    };
  }, [token, clearSession]);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener('uniconnect:unauthorized', onUnauthorized);
    return () => window.removeEventListener('uniconnect:unauthorized', onUnauthorized);
  }, [clearSession]);

  const applyAuth = useCallback((authResponse) => {
    localStorage.setItem(TOKEN_KEY, authResponse.token);
    setToken(authResponse.token);
    setUser(authResponse.user);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const response = await authService.login(credentials);
      applyAuth(response);
      return response.user;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (payload) => {
      const response = await authService.register(payload);
      applyAuth(response);
      return response.user;
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback(
    (updatedUser) => {
      setUser(updatedUser);
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, initializing, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
