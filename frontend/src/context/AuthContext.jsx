import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  saveOrUpdateUser,
  getUserProfile,
  updateUserProfile as updateFirestoreUserProfile,
} from '../services/firestoreService';
import { authService, userService } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // === Customer State (Firebase Auth + Firestore + MongoDB) ===
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // === Global Login Modal State ===
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalOptions, setLoginModalOptions] = useState({
    title: 'Welcome to S2C Crackers',
    subtitle: 'Manage orders, addresses and faster checkout.',
    onSuccess: null,
    redirectUrl: null,
  });

  // === Admin State (Existing Compatibility) ===
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('s2c_admin_token') || null);

  const { toastSuccess, toastError, toastInfo } = useToast();

  // Helper to map raw Firebase error codes to friendly customer messages
  const formatAuthError = (err) => {
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'Google login cancelled. Please try again.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Pop-up was blocked by your browser. Please enable pop-ups for this site.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network error. Please check your internet connection and retry.';
    }
    if (code === 'auth/invalid-api-key' || code === 'auth/app-not-authorized') {
      return 'Authentication configuration issue. Please check Firebase settings.';
    }
    return err?.message || 'Login failed. Please try again.';
  };

  // Sync customer session with Firebase on mount
  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.warn('Firebase persistence warning:', err.message);
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // 1. Fetch or create user document in Firestore
            let firestoreDoc = await getUserProfile(firebaseUser.uid);
            if (!firestoreDoc) {
              firestoreDoc = await saveOrUpdateUser(firebaseUser);
            }

            // 2. Dual sync to MongoDB (non-blocking)
            userService
              .syncUser({
                uid: firebaseUser.uid,
                name: firestoreDoc?.name || firebaseUser.displayName || 'Customer',
                email: firebaseUser.email || '',
                phone: firestoreDoc?.phone || firebaseUser.phoneNumber || '',
                photoURL: firebaseUser.photoURL || '',
              })
              .catch((e) => console.warn('MongoDB user sync warning:', e.message));

            setUser(firebaseUser);
            setProfile(firestoreDoc || {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Customer',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'customer',
            });
          } catch (err) {
            console.error('Error hydrating customer profile:', err);
            setUser(firebaseUser);
            setProfile({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Customer',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'customer',
            });
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
    };

    initAuth();

    return () => unsubscribe();
  }, []);

  // Check Admin Auth Token (Backwards Compatibility)
  useEffect(() => {
    const checkAdminAuth = async () => {
      if (token) {
        try {
          const res = await authService.getProfile();
          if (res.data?.success) {
            setAdmin(res.data.admin);
          } else {
            adminLogout();
          }
        } catch (err) {
          adminLogout();
        }
      }
    };

    checkAdminAuth();
  }, [token]);

  // === CUSTOMER AUTH METHODS ===

  /**
   * Google Popup Sign-In
   */
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;

      // 1. Firestore profile sync
      const firestoreUser = await saveOrUpdateUser(loggedUser);

      // 2. MongoDB profile sync
      await userService
        .syncUser({
          uid: loggedUser.uid,
          name: firestoreUser?.name || loggedUser.displayName || 'Customer',
          email: loggedUser.email || '',
          phone: firestoreUser?.phone || loggedUser.phoneNumber || '',
          photoURL: loggedUser.photoURL || '',
        })
        .catch((e) => console.warn('MongoDB sync on login warning:', e.message));

      setUser(loggedUser);
      setProfile(firestoreUser);

      const customerFirstName = (firestoreUser?.name || loggedUser.displayName || 'Friend').split(' ')[0];
      toastSuccess(`✨ Welcome back, ${customerFirstName}!`);

      // If a callback was provided to the modal
      if (typeof loginModalOptions.onSuccess === 'function') {
        loginModalOptions.onSuccess(loggedUser);
      }

      closeLoginModal();
      return loggedUser;
    } catch (err) {
      const friendlyMsg = formatAuthError(err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        toastError(friendlyMsg);
      }
      throw new Error(friendlyMsg);
    }
  };

  /**
   * Customer Logout
   */
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      toastInfo('You have logged out successfully.');
    } catch (err) {
      console.error('Error signing out:', err);
      toastError('Failed to log out. Please try again.');
    }
  };

  /**
   * Update Profile in both Firestore and MongoDB
   */
  const updateCustomerProfile = async (updates) => {
    if (!user?.uid) throw new Error('You must be logged in to update your profile.');

    try {
      // 1. Update Firestore
      await updateFirestoreUserProfile(user.uid, updates);

      // 2. Update MongoDB
      await userService.updateProfile({
        uid: user.uid,
        ...updates,
      });

      // 3. Update local state
      setProfile((prev) => ({
        ...prev,
        ...updates,
      }));

      toastSuccess('Profile details updated successfully!');
      return true;
    } catch (err) {
      console.error('Error updating customer profile:', err);
      toastError('Failed to update profile details. Please try again.');
      throw err;
    }
  };

  // === GLOBAL LOGIN MODAL CONTROLS ===
  const openLoginModal = useCallback((options = {}) => {
    setLoginModalOptions({
      title: options.title || 'Welcome to S2C Crackers',
      subtitle: options.subtitle || 'Manage orders, addresses and faster checkout.',
      onSuccess: options.onSuccess || null,
      redirectUrl: options.redirectUrl || null,
    });
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setLoginModalOptions((prev) => ({ ...prev, onSuccess: null, redirectUrl: null }));
  }, []);

  // === ADMIN AUTH METHODS (Backwards Compatibility) ===
  const loginAdmin = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data.success && res.data.token) {
      localStorage.setItem('s2c_admin_token', res.data.token);
      localStorage.setItem('s2c_admin_user', JSON.stringify(res.data.admin));
      setToken(res.data.token);
      setAdmin(res.data.admin);
      return res.data;
    }
    throw new Error(res.data.message || 'Admin login failed');
  };

  const adminLogout = () => {
    localStorage.removeItem('s2c_admin_token');
    localStorage.removeItem('s2c_admin_user');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        // Customer State & Methods
        user,
        profile,
        loading,
        loginWithGoogle,
        logout,
        updateCustomerProfile,
        updateProfile: updateCustomerProfile, // alias

        // Modal Controls
        isLoginModalOpen,
        loginModalOptions,
        openLoginModal,
        closeLoginModal,

        // Admin Compatibility
        admin,
        token,
        isAuthenticated: (!!token && !!admin) || !!user,
        isAdminAuthenticated: !!token && !!admin,
        login: loginAdmin, // existing AdminLoginPage uses login(email, password)
        adminLogout,
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
