/**
 * Formats a clean pre-filled WhatsApp message URL for S2C Crackers
 */
export const createWhatsAppOrderUrl = (order, businessPhone = '919944476516') => {
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

Total Amount: ₹${order.totalAmount} (Cash On Delivery)
Delivery Address: ${order.customerDetails.address}, ${order.customerDetails.city} - ${order.customerDetails.pincode}

Please confirm my order.`;

  const cleanPhone = (businessPhone || '919944476516').replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Direct WhatsApp chat link for customer inquiries / quick orders
 */
export const createWhatsAppGeneralChatUrl = (
  businessPhone = '919944476516',
  defaultMessage = 'Hello S2C Crackers, I would like to place an order.'
) => {
  const cleanPhone = (businessPhone || '919944476516').replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`;
};

/**
 * Quick order WhatsApp URL
 */
export const createQuickOrderWhatsAppUrl = (
  businessPhone = '919944476516',
  message = 'Hello S2C Crackers, I would like to place an order.'
) => {
  const cleanPhone = (businessPhone || '919944476516').replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
