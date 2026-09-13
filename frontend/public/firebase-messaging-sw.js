/* eslint-disable no-undef */
// S2C Crackers Admin PWA - Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyCh6HPOdgwElndvmhAfepranBfXxZdBn5k",
  authDomain: "s2c-crackers.firebaseapp.com",
  projectId: "s2c-crackers",
  storageBucket: "s2c-crackers.firebasestorage.app",
  messagingSenderId: "846368923282",
  appId: "1:846368923282:web:6693a3920be4908ad0104b"
});

const messaging = firebase.messaging();

// Background Message Handler
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM Service Worker] Received background order message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || '🚨 New Order Received';
  const notificationBody =
    payload.notification?.body ||
    payload.data?.body ||
    (payload.data?.orderId
      ? `Order ID: ${payload.data.orderId}\nCustomer: ${payload.data.customerName || 'Customer'}\nAmount: ₹${payload.data.amount || ''}`
      : 'You have a new festival order on S2C Crackers!');

  const orderId = payload.data?.orderId || '';
  const targetUrl = payload.data?.url || (orderId ? `/admin/orders/${orderId}` : '/admin/dashboard?tab=orders');

  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-badge.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: orderId ? `order-${orderId}` : `s2c-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl,
      orderId: orderId,
      customerName: payload.data?.customerName || '',
      amount: payload.data?.amount || '',
      notificationType: payload.data?.notificationType || 'NEW_ORDER',
      receivedAt: Date.now(),
    },
    actions: [
      {
        action: 'view',
        title: '👁️ View Order',
      },
      {
        action: 'dismiss',
        title: '✕ Dismiss',
      },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification Click Event Handler - Deep linking to /admin/orders/{orderId}
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const orderId = notificationData.orderId || '';
  const targetUrl = notificationData.url || (orderId ? `/admin/orders/${orderId}` : '/admin/dashboard?tab=orders');

  // Deep Link Focus / Open Window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there is already an admin window open
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.postMessage({
            type: 'FCM_NOTIFICATION_CLICK',
            orderId: orderId,
            targetUrl: targetUrl,
            data: notificationData,
          });
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      // If no admin window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Service Worker Install & Activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
