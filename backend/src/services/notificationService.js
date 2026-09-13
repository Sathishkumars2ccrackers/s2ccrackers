const AdminNotificationToken = require('../models/AdminNotificationToken');
const NotificationLog = require('../models/NotificationLog');
const { getMessaging, isFirebaseConfigured } = require('../config/firebaseAdmin');

/**
 * Prune invalid or unregistered FCM tokens from MongoDB
 */
const pruneInvalidTokens = async (tokensToRemove) => {
  if (!tokensToRemove || tokensToRemove.length === 0) return;
  try {
    const result = await AdminNotificationToken.deleteMany({ token: { $in: tokensToRemove } });
    console.log(`🧹 Pruned ${result.deletedCount} invalid/expired FCM tokens.`);
  } catch (err) {
    console.error('Failed to prune invalid tokens:', err.message);
  }
};

/**
 * Send push notification to all registered active admin devices
 * Supports multi-device delivery, offline queueing, automatic invalid token pruning, and delivery audit logging.
 */
const sendPushNotification = async ({
  type = 'NEW_ORDER',
  title,
  body,
  data = {},
  orderId = null,
  retryCount = 0,
}) => {
  try {
    // 1. Fetch all active admin tokens
    const activeDevices = await AdminNotificationToken.find({ isActive: true });

    if (!activeDevices || activeDevices.length === 0) {
      console.log(`ℹ️ Push notification [${type}]: No active admin devices registered.`);
      // Record log entry
      await NotificationLog.create({
        notificationType: type,
        title,
        body,
        orderId: orderId ? String(orderId) : null,
        deviceCount: 0,
        successCount: 0,
        failureCount: 0,
        deliveryStatus: 'no_devices',
        details: [{ error: 'No active admin devices registered' }],
      }).catch((e) => console.error('Failed to write notification log:', e.message));

      return {
        success: true,
        deviceCount: 0,
        message: 'No registered devices found.',
      };
    }

    const tokens = activeDevices.map((d) => d.token);
    const messaging = getMessaging();

    // If Firebase Admin SDK is not initialized, record error and return failure
    if (!isFirebaseConfigured() || !messaging) {
      const errMsg = 'Firebase Admin SDK is not initialized. Cannot dispatch push notifications.';
      console.warn(`⚠️ [FCM Warning]: ${errMsg}`);

      await NotificationLog.create({
        notificationType: type,
        title,
        body,
        orderId: orderId ? String(orderId) : null,
        deviceCount: tokens.length,
        successCount: 0,
        failureCount: tokens.length,
        deliveryStatus: 'failed',
        details: activeDevices.map((d) => ({
          token: d.token.length > 20 ? `${d.token.slice(0, 12)}...${d.token.slice(-6)}` : d.token,
          deviceName: d.deviceName,
          success: false,
          error: errMsg,
        })),
      }).catch((e) => console.error('Failed to write notification error log:', e.message));

      return {
        success: false,
        deliveryStatus: 'failed',
        deviceCount: tokens.length,
        error: errMsg,
      };
    }

    // Ensure all data payload fields are strings
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = value !== null && value !== undefined ? String(value) : '';
    }
    stringData.notificationType = type;
    if (orderId) stringData.orderId = String(orderId);
    if (!stringData.url) {
      stringData.url = orderId ? `/admin/orders/${orderId}` : '/admin/dashboard';
    }

    // Prepare WebPush & Android High-Priority Payload
    const payload = {
      tokens,
      notification: {
        title,
        body,
      },
      data: stringData,
      android: {
        priority: 'high',
        ttl: 86400 * 1000, // 24 hours offline queueing
        notification: {
          channelId: 's2c_order_alerts',
          priority: 'max',
          defaultSound: true,
          defaultVibrateTimings: true,
          icon: 'icon_notification',
          color: '#f97316',
          clickAction: stringData.url,
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '86400', // 24 hours
        },
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-badge.png',
          vibrate: [300, 100, 300, 100, 300],
          tag: type === 'NEW_ORDER' ? `order-${orderId}` : `s2c-${type.toLowerCase()}-${Date.now()}`,
          renotify: true,
          requireInteraction: true,
          data: stringData,
          actions: [
            { action: 'view', title: '👁️ View Order' },
            { action: 'close', title: '✕ Dismiss' },
          ],
        },
        fcmOptions: {
          link: stringData.url,
        },
      },
    };

    // 2. Dispatch Multicast Message via Firebase Admin
    const response = await messaging.sendEachForMulticast(payload);

    let successCount = 0;
    let failureCount = 0;
    const tokensToRemove = [];
    const logDetails = [];

    response.responses.forEach((resp, idx) => {
      const device = activeDevices[idx];
      const maskedToken = device.token.length > 20
        ? `${device.token.slice(0, 12)}...${device.token.slice(-6)}`
        : device.token;

      if (resp.success) {
        successCount++;
        console.log('[FCM Multicast Dispatch Success]', {
          token: maskedToken,
          deviceName: device.deviceName,
          messageId: resp.messageId,
          status: 'SUCCESS',
        });
        logDetails.push({
          token: maskedToken,
          deviceName: device.deviceName,
          success: true,
          messageId: resp.messageId,
        });
      } else {
        failureCount++;
        const errorCode = resp.error?.code || 'unknown_error';
        const errorMessage = resp.error?.message || 'Push dispatch failed';

        console.error('[FCM Multicast Dispatch Failure]', {
          token: maskedToken,
          deviceName: device.deviceName,
          errorCode,
          errorMessage,
          status: 'FAILURE',
        });

        logDetails.push({
          token: maskedToken,
          deviceName: device.deviceName,
          success: false,
          error: `${errorCode}: ${errorMessage}`,
        });

        // Detect expired or uninstalled tokens
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token' ||
          errorMessage.includes('not registered')
        ) {
          tokensToRemove.push(device.token);
        }
      }
    });

    // 3. Auto-prune stale tokens
    if (tokensToRemove.length > 0) {
      await pruneInvalidTokens(tokensToRemove);
    }

    // 4. Update lastActiveAt for successful devices
    await AdminNotificationToken.updateMany(
      { token: { $in: tokens.filter((t) => !tokensToRemove.includes(t)) } },
      { lastActiveAt: new Date() }
    ).catch(() => {});

    // 5. Determine delivery status
    let deliveryStatus = 'sent';
    if (failureCount > 0 && successCount === 0) deliveryStatus = 'failed';
    else if (failureCount > 0) deliveryStatus = 'partial';

    // 6. Record Audit Trail in MongoDB
    await NotificationLog.create({
      notificationType: type,
      title,
      body,
      orderId: orderId ? String(orderId) : null,
      deviceCount: tokens.length,
      successCount,
      failureCount,
      deliveryStatus,
      details: logDetails,
    }).catch((e) => console.error('Failed to create notification log entry:', e.message));

    console.log(
      `📢 [FCM Delivery Complete] Type: ${type} -> Total: ${tokens.length}, Success: ${successCount}, Failed: ${failureCount}`
    );

    // 7. Failsafe retry once on transient total failure
    if (deliveryStatus === 'failed' && retryCount === 0 && tokens.length > tokensToRemove.length) {
      console.log('🔄 Retrying notification dispatch once in 3 seconds...');
      setTimeout(() => {
        sendPushNotification({
          type,
          title,
          body,
          data,
          orderId,
          retryCount: 1,
        }).catch((e) => console.error('Retry dispatch failed:', e.message));
      }, 3000);
    }

    return {
      success: successCount > 0,
      deliveryStatus,
      deviceCount: tokens.length,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error('❌ Error sending push notification:', error.message);

    // Log failure
    await NotificationLog.create({
      notificationType: type,
      title,
      body,
      orderId: orderId ? String(orderId) : null,
      deliveryStatus: 'failed',
      details: [{ error: error.message }],
    }).catch(() => {});

    // Failsafe: Retry once
    if (retryCount === 0) {
      setTimeout(() => {
        sendPushNotification({
          type,
          title,
          body,
          data,
          orderId,
          retryCount: 1,
        }).catch(() => {});
      }, 3000);
    }

    return {
      success: false,
      deliveryStatus: 'failed',
      error: error.message,
    };
  }
};

/**
 * Trigger Instant New Order Push Notification to all Admin Devices
 */
const sendOrderNotification = async (order) => {
  const customerName = order.customerDetails?.name || 'Valued Customer';
  const totalAmount = order.totalAmount || 0;
  const orderId = order.orderId;
  const phone = order.customerDetails?.phone || '';

  const title = '🚨 New Order Received';
  const body = `Order ID: ${orderId}\nCustomer: ${customerName}\nAmount: ₹${totalAmount}`;

  return await sendPushNotification({
    type: 'NEW_ORDER',
    title,
    body,
    orderId,
    data: {
      orderId,
      customerName,
      phone,
      amount: String(totalAmount),
      city: order.customerDetails?.city || '',
      url: `/admin/orders/${orderId}`,
    },
  });
};

/**
 * Trigger Test Push Notification
 * Uses direct firebase-admin.messaging().send()
 */
const sendTestNotification = async (admin, specificToken = null) => {
  const title = '🔔 Test Notification';
  const body = 'S2C Crackers notification system is working correctly.';
  const messaging = getMessaging();

  if (!isFirebaseConfigured() || !messaging) {
    throw new Error('Firebase Admin SDK is not initialized. Please ensure valid service account credentials are loaded.');
  }

  if (specificToken) {
    const maskedToken = specificToken.length > 20
      ? `${specificToken.slice(0, 12)}...${specificToken.slice(-6)}`
      : specificToken;

    console.log('[FCM Dispatch Test Notification]', {
      fcmToken: maskedToken,
      time: new Date().toISOString(),
    });

    const payload = {
      token: specificToken,
      notification: { title, body },
      data: {
        notificationType: 'TEST_NOTIFICATION',
        url: '/admin/dashboard',
        testTime: new Date().toISOString(),
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-badge.png',
          vibrate: [200, 100, 200],
        },
      },
    };

    try {
      // Real firebase-admin.messaging().send() call
      const messageId = await messaging.send(payload);

      console.log('[FCM Dispatch Test Notification Success]', {
        fcmToken: maskedToken,
        messageId,
        status: 'SUCCESS',
      });

      await NotificationLog.create({
        notificationType: 'TEST_NOTIFICATION',
        title,
        body,
        deviceCount: 1,
        successCount: 1,
        failureCount: 0,
        deliveryStatus: 'sent',
        details: [{ token: maskedToken, success: true, messageId }],
      }).catch(() => {});

      return { success: true, messageId, fcmToken: maskedToken };
    } catch (err) {
      console.error('[FCM Dispatch Test Notification Failure]', {
        fcmToken: maskedToken,
        error: err.message,
        status: 'FAILURE',
      });

      await NotificationLog.create({
        notificationType: 'TEST_NOTIFICATION',
        title,
        body,
        deviceCount: 1,
        successCount: 0,
        failureCount: 1,
        deliveryStatus: 'failed',
        details: [{ token: maskedToken, success: false, error: err.message }],
      }).catch(() => {});

      throw err;
    }
  }

  return await sendPushNotification({
    type: 'TEST_NOTIFICATION',
    title,
    body,
    data: {
      notificationType: 'TEST_NOTIFICATION',
      url: '/admin/dashboard',
    },
  });
};

/**
 * Fetch Notification Health Metrics
 */
const getNotificationHealth = async () => {
  const isConfig = isFirebaseConfigured();
  const totalDevices = await AdminNotificationToken.countDocuments();
  const activeDevices = await AdminNotificationToken.countDocuments({ isActive: true });
  const totalLogs = await NotificationLog.countDocuments();
  const lastLog = await NotificationLog.findOne().sort({ createdAt: -1 });

  return {
    firebaseConfigured: isConfig,
    firebaseInitialized: isConfig,
    messagingReady: isConfig,
    simulationMode: !isConfig,
    totalDevices,
    activeDevices,
    totalLogs,
    lastNotificationSentAt: lastLog ? lastLog.createdAt : null,
    lastDeliveryStatus: lastLog ? lastLog.deliveryStatus : 'none',
  };
};

module.exports = {
  sendPushNotification,
  sendOrderNotification,
  sendTestNotification,
  getNotificationHealth,
};
