import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('wh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('wh_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('wh_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('wh_token', newToken);
      localStorage.setItem('wh_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wh_token');
    localStorage.removeItem('wh_user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isTrainer: user?.role === 'trainer',
    isStudent: user?.role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
