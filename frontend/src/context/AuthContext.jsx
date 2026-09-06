import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const savedAdmin = localStorage.getItem('s2c_admin_user');
      return savedAdmin ? JSON.parse(savedAdmin) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('s2c_admin_token') || null);
  const [loading, setLoading] = useState(true);

  const { toastSuccess, toastError, toastInfo } = useToast();

  // Admin Logout Helper
  const logout = useCallback(() => {
    localStorage.removeItem('s2c_admin_token');
    localStorage.removeItem('s2c_admin_user');
    setToken(null);
    setAdmin(null);
    toastInfo('Logged out of Admin Gateway.');
  }, [toastInfo]);

  // Check & Validate Admin Session Token on Mount
  useEffect(() => {
    const verifyAdminSession = async () => {
      const currentToken = localStorage.getItem('s2c_admin_token');
      if (currentToken) {
        try {
          const res = await authService.getProfile();
          if (res.data?.success && res.data?.admin) {
            setAdmin(res.data.admin);
            setToken(currentToken);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      } else {
        setAdmin(null);
        setToken(null);
      }
      setLoading(false);
    };

    verifyAdminSession();
  }, [logout]);

  // Admin Login Handler (Used by AdminLoginPage)
  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      if (res.data?.success && res.data?.token) {
        const receivedToken = res.data.token;
        const receivedAdmin = res.data.admin;

        localStorage.setItem('s2c_admin_token', receivedToken);
        localStorage.setItem('s2c_admin_user', JSON.stringify(receivedAdmin));

        setToken(receivedToken);
        setAdmin(receivedAdmin);
        toastSuccess(`Welcome back, ${receivedAdmin.name || 'Administrator'}!`);
        return res.data;
      }
      throw new Error(res.data?.message || 'Invalid administrator credentials');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      toastError(msg);
      throw new Error(msg);
    }
  };

  const isAuthenticated = Boolean(token && admin);

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        loading,
        isAuthenticated,
        isAdminAuthenticated: isAuthenticated,
        login,
        logout,
        adminLogout: logout,
      }}
    >
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

export default AuthContext;
