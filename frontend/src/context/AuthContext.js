import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('peekaboo_token'));

  const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // Update axios instance when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.Authorization;
    }
  }, [token]);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('peekaboo_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('peekaboo_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('peekaboo_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('peekaboo_token');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const origin_url = window.location.origin;
    await api.post('/auth/forgot-password', { email, origin_url });
  };

  const resetPassword = async (resetToken, password) => {
    await api.post('/auth/reset-password', { token: resetToken, password });
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    api,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
