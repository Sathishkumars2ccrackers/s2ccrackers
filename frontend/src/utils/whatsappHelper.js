import { formatDate, formatCurrency } from './formatters.js';

const DEFAULT_STORE_PHONE = '919944476516';
const DEFAULT_DOMAIN = 'www.s2ccrackers.com';

/**
 * Validates and normalizes Indian mobile phone numbers
 * Rejects invalid patterns (e.g., 0000000000, 1234567890, repetitive numbers)
 */
export const validateAndCleanIndianPhone = (phone) => {
  if (!phone) {
    return { isValid: false, cleanPhone: '', error: 'Customer phone number not available.' };
  }

  // Strip all non-digit characters
  let digits = phone.toString().replace(/\D/g, '');

  // Strip leading zeros
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Handle +91 / 91 prefix
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // Must be exactly 10 digits
  if (digits.length !== 10) {
    return { isValid: false, cleanPhone: '', error: 'Customer phone number must be 10 digits.' };
  }

  // Check valid Indian mobile starting digits: 6, 7, 8, 9
  if (!/^[6-9]/.test(digits)) {
    return { isValid: false, cleanPhone: '', error: 'Invalid Indian mobile number (must start with 6-9).' };
  }

  // Reject all repeated single digits (0000000000, 1111111111, 9999999999)
  if (/^(\d)\1{9}$/.test(digits)) {
    return { isValid: false, cleanPhone: '', error: 'Invalid customer phone number (repeated digits).' };
  }

  // Reject obvious sequential fake numbers
  const sequentialFakes = ['1234567890', '0123456789', '9876543210', '8765432109'];
  if (sequentialFakes.includes(digits)) {
    return { isValid: false, cleanPhone: '', error: 'Invalid customer phone number.' };
  }

  return {
    isValid: true,
    raw10Digits: digits,
    cleanPhone: `91${digits}`,
  };
};

/**
 * Resolves the best available phone number from order customer details
 * 1. Primary phone
 * 2. Secondary/Alt phone fallback
 */
export const getBestCustomerPhone = (customerDetails) => {
  if (!customerDetails) {
    return { isValid: false, cleanPhone: '', error: 'Customer details not available.' };
  }

  const primaryValidation = validateAndCleanIndianPhone(customerDetails.phone);
  if (primaryValidation.isValid) {
    return {
      ...primaryValidation,
      isPrimary: true,
      displayPhone: customerDetails.phone,
    };
  }

  const secondaryRaw =
    customerDetails.altPhone ||
    customerDetails.alternatePhone ||
    customerDetails.secondaryPhone;

  if (secondaryRaw) {
    const secondaryValidation = validateAndCleanIndianPhone(secondaryRaw);
    if (secondaryValidation.isValid) {
      return {
        ...secondaryValidation,
        isPrimary: false,
        displayPhone: secondaryRaw,
      };
    }
  }

  return {
    isValid: false,
    cleanPhone: '',
    error: primaryValidation.error || 'Invalid customer phone number',
  };
};

/**
 * Format product list for WhatsApp:
 * • Product Name × Quantity
 */
export const formatProductListForWhatsApp = (items = []) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '• Fireworks Combo Package × 1';
  }

  return items
    .map((item) => `• ${item.name} × ${item.quantity}`)
    .join('\n');
};

/**
 * Formats structured delivery address
 */
export const formatDeliveryAddressForWhatsApp = (customerDetails) => {
  if (!customerDetails) return 'Madurai / Sivakasi, Tamil Nadu';
  const parts = [
    customerDetails.address,
    customerDetails.landmark ? `(Landmark: ${customerDetails.landmark})` : '',
    `${customerDetails.city} - ${customerDetails.pincode}`,
    customerDetails.state || 'Tamil Nadu',
  ].filter(Boolean);

  return parts.join('\n');
};

// ============================================
// TEMPLATE GENERATORS (MULTI-TEMPLATE READY)
// ============================================

/**
 * 1. CONFIRM_ORDER Template (Admin to Customer)
 */
export const generateAdminWhatsAppConfirmationMessage = (order, storePhone = DEFAULT_STORE_PHONE) => {
  if (!order) return '';

  const c = order.customerDetails || {};
  const customerName = c.name ? c.name.trim() : 'Valued Customer';
  const customerId = order.uid || c.phone || order.orderId;
  const orderId = order.orderId;
  const orderDate = formatDate(order.createdAt || new Date(), true);
  const productList = formatProductListForWhatsApp(order.items);
  const totalAmount = (order.totalAmount || 0).toLocaleString('en-IN');
  const deliveryAddress = formatDeliveryAddressForWhatsApp(c);
  const primaryPhone = c.phone || 'Not provided';
  const secondaryPhone = c.altPhone || c.alternatePhone || c.secondaryPhone || 'Not provided';
  const customerEmail = c.email ? c.email.trim() : '';

  const cleanStore = storePhone.replace(/\D/g, '').replace(/^91/, '');

  let emailBlock = '';
  if (customerEmail) {
    emailBlock = `\n\nCustomer Email:\n${customerEmail}`;
  }

  const trackingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/track-order`
    : 'https://www.s2ccrackers.com/track-order';

  return `Hello ${customerName},

Thank you for choosing S2C Crackers.

Your order has been reviewed and confirmed by our team.

━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━

Customer ID:
${customerId}

Order ID:
${orderId}

Order Date:
${orderDate}

━━━━━━━━━━━━━━━
PRODUCTS
━━━━━━━━━━━━━━━

${productList}

━━━━━━━━━━━━━━━
ORDER VALUE
━━━━━━━━━━━━━━━

Total Amount:
₹${totalAmount}

━━━━━━━━━━━━━━━
DELIVERY ADDRESS
━━━━━━━━━━━━━━━

${deliveryAddress}

━━━━━━━━━━━━━━━
CONTACT DETAILS
━━━━━━━━━━━━━━━

Primary Phone:
${primaryPhone}

Secondary Phone:
${secondaryPhone}${emailBlock}

━━━━━━━━━━━━━━━
ORDER STATUS
━━━━━━━━━━━━━━━

Confirmed

Our team will contact you shortly regarding:

• Product availability
• Delivery timeline
• Payment method
• Dispatch details

You can track your order here:
${trackingLink}

For assistance:

S2C Crackers

WhatsApp:
${cleanStore || '9944476516'}

Thank you for shopping with us.`;
};

/**
 * 2. DISPATCH_UPDATE Template (Future Ready)
 */
export const generateAdminWhatsAppDispatchMessage = (order, storePhone = DEFAULT_STORE_PHONE) => {
  if (!order) return '';
  const c = order.customerDetails || {};
  const customerName = c.name ? c.name.trim() : 'Valued Customer';
  const trackingNumber = order.trackingNumber || 'Tracking will be SMSed';
  const courier = order.courierName || 'Sivakasi Surface Transport';

  const trackingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/track-order`
    : 'https://www.s2ccrackers.com/track-order';

  return `Hello ${customerName},

Great news! Your S2C Crackers order *${order.orderId}* has been securely packed and dispatched from Sivakasi factory.

━━━━━━━━━━━━━━━
DISPATCH DETAILS
━━━━━━━━━━━━━━━

Order ID: ${order.orderId}
Courier Partner: ${courier}
Tracking LR No: ${trackingNumber}
Total Amount: ₹${(order.totalAmount || 0).toLocaleString('en-IN')}

Track status anytime:
${trackingLink}

Thank you for choosing S2C Crackers!`;
};

/**
 * 3. DELIVERED_UPDATE Template (Future Ready)
 */
export const generateAdminWhatsAppDeliveredMessage = (order, storePhone = DEFAULT_STORE_PHONE) => {
  if (!order) return '';
  const c = order.customerDetails || {};
  const customerName = c.name ? c.name.trim() : 'Valued Customer';

  return `Hello ${customerName},

Your festival crackers order *${order.orderId}* has been successfully delivered! 🎆

We wish you and your family a safe, grand, and joyful celebration.

Thank you for celebrating with S2C Crackers!`;
};

/**
 * 4. CANCELLED_ORDER Template (Future Ready)
 */
export const generateAdminWhatsAppCancelledMessage = (order, storePhone = DEFAULT_STORE_PHONE) => {
  if (!order) return '';
  const c = order.customerDetails || {};
  const customerName = c.name ? c.name.trim() : 'Valued Customer';
  const reason = order.cancellationReason || 'Requested cancellation / Out of stock';

  return `Hello ${customerName},

Regarding your order *${order.orderId}*, it has been marked as Cancelled.

Reason: ${reason}

If you have any questions or would like to re-order alternative items, please message us here.`;
};

/**
 * Master Admin WhatsApp URL Generator
 * Supports template types: CONFIRM_ORDER, DISPATCH_UPDATE, DELIVERED_UPDATE, CANCELLED_ORDER
 */
export const createAdminOrderWhatsAppUrl = (
  order,
  templateType = 'CONFIRM_ORDER',
  storePhone = DEFAULT_STORE_PHONE
) => {
  if (!order || !order.customerDetails) {
    return {
      success: false,
      error: 'Order or customer details missing.',
    };
  }

  const phoneResult = getBestCustomerPhone(order.customerDetails);
  if (!phoneResult.isValid) {
    return {
      success: false,
      error: phoneResult.error || 'Customer phone number not available.',
    };
  }

  let message = '';
  switch (templateType) {
    case 'DISPATCH_UPDATE':
      message = generateAdminWhatsAppDispatchMessage(order, storePhone);
      break;
    case 'DELIVERED_UPDATE':
      message = generateAdminWhatsAppDeliveredMessage(order, storePhone);
      break;
    case 'CANCELLED_ORDER':
      message = generateAdminWhatsAppCancelledMessage(order, storePhone);
      break;
    case 'CONFIRM_ORDER':
    default:
      message = generateAdminWhatsAppConfirmationMessage(order, storePhone);
      break;
  }

  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phoneResult.cleanPhone}?text=${encodedMessage}`;

  return {
    success: true,
    url: waUrl,
    customerPhone: phoneResult.cleanPhone,
    displayPhone: phoneResult.displayPhone,
    isPrimary: phoneResult.isPrimary,
    message,
  };
};

/**
 * Customer Storefront: Order Placement WhatsApp link (Customer -> Store)
 */
export const createWhatsAppOrderUrl = (order, businessPhone = DEFAULT_STORE_PHONE) => {
  if (!order || !order.customerDetails) return '#';

  const itemsList = order.items
    ? order.items
        .map((item) => `• ${item.quantity}x ${item.name} (₹${item.price * item.quantity})`)
        .join('\n')
    : '';

  const message = `Hello S2C Crackers,

I have placed an order through the website.

Order ID: ${order.orderId}
Customer Name: ${order.customerDetails.name}
Phone Number: ${order.customerDetails.phone}

Ordered Items:
${itemsList}

Total Amount: ₹${order.totalAmount} (Door Delivery Available)
Delivery Address: ${order.customerDetails.address}, ${order.customerDetails.city} - ${order.customerDetails.pincode}

Please confirm my order.`;

  const cleanPhone = (businessPhone || DEFAULT_STORE_PHONE).replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Direct WhatsApp chat link for customer inquiries / quick orders
 */
export const createWhatsAppGeneralChatUrl = (
  businessPhone = DEFAULT_STORE_PHONE,
  defaultMessage = 'Hello S2C Crackers, I would like to place an order.'
) => {
  const cleanPhone = (businessPhone || DEFAULT_STORE_PHONE).replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`;
};

/**
 * Quick order WhatsApp URL
 */
export const createQuickOrderWhatsAppUrl = (
  businessPhone = DEFAULT_STORE_PHONE,
  message = 'Hello S2C Crackers, I would like to place an order.'
) => {
  const cleanPhone = (businessPhone || DEFAULT_STORE_PHONE).replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
