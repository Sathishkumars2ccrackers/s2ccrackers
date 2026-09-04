/**
 * Formats a clean pre-filled WhatsApp message URL for S2C Crackers
 */
export const createWhatsAppOrderUrl = (order, businessPhone = '919442187654') => {
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

  const cleanPhone = (businessPhone || '919442187654').replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Direct WhatsApp chat link for customer inquiries / custom orders
 */
export const createWhatsAppGeneralChatUrl = (businessPhone = '919442187654', defaultMessage = 'Hello S2C Crackers, I would like to inquire about Sivakasi crackers and festival offers.') => {
  const cleanPhone = (businessPhone || '919442187654').replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`;
};
