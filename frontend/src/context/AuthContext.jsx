import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ec_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ec_token'));
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('ec_theme') || 'dark');
  const [showPlacementModal, setShowPlacementModal] = useState(false);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ec_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Sync current user on load
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await apiRequest('/auth/me');
          setUser(res.user);
          localStorage.setItem('ec_user', JSON.stringify(res.user));
        } catch (err) {
          console.warn('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();

    const handleAuthChange = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth_change', handleAuthChange);
    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, [token]);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', 'POST', { email, password });
    localStorage.setItem('ec_token', res.token);
    localStorage.setItem('ec_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (email, password, full_name, initial_level = 'B1') => {
    const res = await apiRequest('/auth/register', 'POST', {
      email,
      password,
      full_name,
      initial_level
    });
    localStorage.setItem('ec_token', res.token);
    localStorage.setItem('ec_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    // Suggest placement test right after registration
    setShowPlacementModal(true);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('ec_token');
    localStorage.removeItem('ec_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest('/auth/me');
      setUser(res.user);
      localStorage.setItem('ec_user', JSON.stringify(res.user));
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        refreshUser,
        showPlacementModal,
        setShowPlacementModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
