import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ROLE_LEVELS = { USER: 1, STAFF: 2, ADMIN: 3, DEVELOPER: 4 };

const AuthContext = createContext(null);

/* Reads auth state straight from localStorage. Must run synchronously on
   mount (as the useState initializer) — if it instead only ran inside a
   useEffect, every refresh would render once with isLoggedIn:false before
   the real state loads, and any redirect guard reading that first render
   (e.g. RequireAdmin) would incorrectly bounce a logged-in user to /login. */
const readAuthFromStorage = () => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  if (token) {
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      if (exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        return { isLoggedIn: false, role: null, token: null };
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      return { isLoggedIn: false, role: null, token: null };
    }
  }

  return { isLoggedIn: Boolean(token), role: token ? (role || null) : null, token: token || null };
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(readAuthFromStorage);

  const syncAuth = useCallback(() => {
    setAuth(readAuthFromStorage());
  }, []);

  const login = useCallback((token, role) => {
    localStorage.setItem('token', token);
    if (role) localStorage.setItem('role', role);
    else localStorage.removeItem('role');
    setAuth({ isLoggedIn: true, role: role || null, token });
    window.dispatchEvent(new Event('auth-changed'));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuth({ isLoggedIn: false, role: null, token: null });
    window.dispatchEvent(new Event('auth-changed'));
  }, []);

  useEffect(() => {
    syncAuth();
    window.addEventListener('auth-changed', syncAuth);
    const interval = setInterval(syncAuth, 60_000);
    return () => {
      window.removeEventListener('auth-changed', syncAuth);
      clearInterval(interval);
    };
  }, [syncAuth]);

  const userLevel = ROLE_LEVELS[auth.role] || 0;

  return (
    <AuthContext.Provider value={{
      ...auth,
      isShopUser:  userLevel >= ROLE_LEVELS.STAFF,    // STAFF, ADMIN, DEVELOPER
      isAdmin:     userLevel >= ROLE_LEVELS.ADMIN,    // ADMIN, DEVELOPER
      isDeveloper: userLevel >= ROLE_LEVELS.DEVELOPER,
      login,
      logout,
      syncAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
