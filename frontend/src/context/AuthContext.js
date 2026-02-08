import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const RAW_API_URL = (process.env.REACT_APP_BACKEND_URL || "").trim();

const API_URL =
  !RAW_API_URL || RAW_API_URL === "undefined" || RAW_API_URL === "null"
    ? ""
    : RAW_API_URL;


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('peekaboo_token'));

  // Create api instance that updates when token changes
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL ? `${API_URL}/api` : "/api",
    });
    
    // Add interceptor to always use latest token
    instance.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('peekaboo_token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });

    // Handle 401 responses - only for truly expired tokens, not initial auth check
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Don't auto-logout on /auth/me failures (handled separately)
        const isAuthCheck = error.config?.url?.includes('/auth/me');
        if (error.response?.status === 401 && !isAuthCheck) {
          // 401 on API call - let component handle the error
        }
        return Promise.reject(error);
      }
    );
    
    return instance;
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('peekaboo_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setToken(storedToken);
      } catch (error) {
        // Only clear auth on explicit 401 (invalid/expired token)
        if (error.response?.status === 401) {
          localStorage.removeItem('peekaboo_token');
          setToken(null);
          setUser(null);
        }
        // Network errors or other issues - keep token, don't force logout
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [api]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('peekaboo_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };


  const register = async (name, email, password, phone = null) => {
    const response = await api.post('/auth/register', { name, email, password, phone });
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
    isStaff: user?.role === 'staff',
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
