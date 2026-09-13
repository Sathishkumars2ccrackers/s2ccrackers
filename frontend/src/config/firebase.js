import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase Web App Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCh6HPOdgwElndvmhAfepranBfXxZdBn5k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "s2c-crackers.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "s2c-crackers",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "s2c-crackers.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "846368923282",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:846368923282:web:6693a3920be4908ad0104b",
};

// Initialize or reuse Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Detect client device details (OS, Browser, Device Name, Device Type)
 */
export const detectDeviceInfo = () => {
  const ua = navigator.userAgent || '';
  let os = 'Unknown OS';
  let deviceType = 'desktop';

  if (/android/i.test(ua)) {
    os = 'Android';
    deviceType = /tablet|nexus 7|nexus 9|nexus 10/i.test(ua) ? 'tablet' : 'mobile';
  } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    os = /iPad/.test(ua) ? 'iPadOS' : 'iOS';
    deviceType = /iPad/.test(ua) ? 'tablet' : 'mobile';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
    deviceType = 'desktop';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
    deviceType = 'desktop';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    deviceType = 'desktop';
  }

  let browser = 'Unknown Browser';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  const isMobile = deviceType !== 'desktop';
  const deviceName = `${browser} on ${os}${isMobile ? ' Mobile' : ' Device'}`;

  return {
    deviceName,
    deviceType,
    browser,
    os,
    userAgent: ua,
  };
};

/**
 * Register Firebase Service Worker
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      console.log('✅ Service Worker registered successfully with scope:', registration.scope);
      return registration;
    } catch (err) {
      console.error('❌ Service Worker registration failed:', err);
      return null;
    }
  }
  return null;
};

/**
 * Request Notification Permission and Generate FCM Registration Token
 */
export const requestPushToken = async (customVapidKey = null) => {
  try {
    const supported = await isSupported();
    if (!supported) {
      throw new Error('Firebase Cloud Messaging is not supported in this browser.');
    }

    if (!('Notification' in window)) {
      throw new Error('This browser does not support desktop/mobile notifications.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was denied. Please allow notifications in browser site settings.');
    }

    const swRegistration = await registerServiceWorker();
    const messaging = getMessaging(app);

    const vapidKey =
      customVapidKey ||
      import.meta.env.VITE_FIREBASE_VAPID_KEY ||
      undefined;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration || undefined,
    });

    if (!token) {
      throw new Error('No registration token available. Request permission to generate one.');
    }

    return { token, permission };
  } catch (error) {
    console.error('Error generating FCM push token:', error);
    throw error;
  }
};

/**
 * Setup Foreground Message Listener
 */
export const setupForegroundMessageListener = (callback) => {
  let unsubscribe = () => {};

  isSupported().then((supported) => {
    if (supported) {
      try {
        const messaging = getMessaging(app);
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('🔔 [Foreground FCM Message received]:', payload);
          if (callback) callback(payload);
        });
      } catch (e) {
        console.warn('Foreground messaging listener initialization warning:', e.message);
      }
    }
  });

  // Also listen for service worker messages when tab is focused
  const swListener = (event) => {
    if (event.data && event.data.type === 'FCM_NOTIFICATION_CLICK') {
      if (callback) {
        callback({
          isClickEvent: true,
          ...event.data,
        });
      }
    }
  };

  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', swListener);
  }

  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
    if (navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener('message', swListener);
    }
  };
};

export { app };
