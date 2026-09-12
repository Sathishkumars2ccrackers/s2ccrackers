const nodemailer = require('nodemailer');

let transporter = null;

const initializeMailer = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: { user, pass },
      });
      console.log(`✉️ Email Transporter initialized with ${host}:${port}`);
    } catch (err) {
      console.error('❌ Failed to initialize email transporter:', err.message);
      transporter = null;
    }
  } else {
    console.log('ℹ️ SMTP credentials not fully provided in .env. Order emails will be logged to console in preview format.');
  }
};

initializeMailer();

// HTML email template generator for customer order confirmation
const generateCustomerEmailHTML = (order) => {
  const itemsRows = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #fed7aa;">
        <td style="padding: 12px; font-weight: 500; color: #1e293b;">${item.name}</td>
        <td style="padding: 12px; text-align: center; color: #475569;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; color: #475569;">₹${item.price}</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #b91c1c;">₹${item.subtotal || item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Order Confirmation - S2C Crackers</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding: 24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #fecaca;">
            <!-- Header Banner -->
            <tr style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #d97706 100%);">
              <td style="padding: 30px; text-align: center;">
                <h1 style="color: #fef08a; margin: 0; font-size: 26px; letter-spacing: 1px;">✨ S2C CRACKERS ✨</h1>
                <p style="color: #ffffff; margin: 6px 0 0 0; font-size: 14px;">Direct Factory Genuine Sivakasi Fireworks</p>
                <div style="background-color: #f59e0b; color: #451a03; display: inline-block; padding: 4px 16px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-top: 12px;">
                  ORDER CONFIRMED - DOOR DELIVERY
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px;">
                <p style="font-size: 16px; color: #1e293b; margin-top: 0;">
                  Dear <strong>${order.customerDetails.name}</strong>,
                </p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                  Thank you for placing your festival cracker order with <strong>S2C Crackers</strong>! We have received your order and our Sivakasi packaging team is preparing your authentic fireworks with maximum safety.
                </p>

                <!-- Order Info Card -->
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <table width="100%" style="font-size: 14px;">
                    <tr>
                      <td style="color: #92400e; font-weight: bold;">Order ID:</td>
                      <td style="color: #1e293b; font-weight: bold; text-align: right;">${order.orderId}</td>
                    </tr>
                    <tr>
                      <td style="color: #92400e; font-weight: bold;">Order Date:</td>
                      <td style="color: #1e293b; text-align: right;">${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'long' })}</td>
                    </tr>
                    <tr>
                      <td style="color: #92400e; font-weight: bold;">Payment & Delivery:</td>
                      <td style="color: #047857; font-weight: bold; text-align: right;">Door Delivery Available</td>
                    </tr>
                  </table>
                </div>

                <!-- Products Table -->
                <h3 style="color: #991b1b; font-size: 16px; border-bottom: 2px solid #fee2e2; padding-bottom: 8px; margin-top: 24px;">
                  📦 Ordered Fireworks
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 10px; font-size: 13px;">
                  <thead>
                    <tr style="background-color: #fef2f2; color: #991b1b;">
                      <th style="padding: 10px; text-align: left;">Item</th>
                      <th style="padding: 10px; text-align: center;">Qty</th>
                      <th style="padding: 10px; text-align: right;">Rate</th>
                      <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" style="padding: 10px 12px; text-align: right; color: #475569;">Subtotal:</td>
                      <td style="padding: 10px 12px; text-align: right; color: #1e293b; font-weight: 500;">₹${order.subtotal}</td>
                    </tr>
                    <tr>
                      <td colspan="3" style="padding: 6px 12px; text-align: right; color: #475569;">Delivery Fee:</td>
                      <td style="padding: 6px 12px; text-align: right; color: #1e293b; font-weight: 500;">₹${order.deliveryFee || 0}</td>
                    </tr>
                    <tr style="background-color: #fef2f2;">
                      <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; color: #991b1b; font-size: 15px;">Grand Total:</td>
                      <td style="padding: 12px; text-align: right; font-weight: bold; color: #991b1b; font-size: 16px;">₹${order.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>

                <!-- Delivery Details -->
                <h3 style="color: #991b1b; font-size: 16px; border-bottom: 2px solid #fee2e2; padding-bottom: 8px; margin-top: 28px;">
                  📍 Delivery Address
                </h3>
                <p style="color: #334155; font-size: 13px; line-height: 1.6; margin: 6px 0;">
                  <strong>${order.customerDetails.name}</strong><br/>
                  ${order.customerDetails.address}<br/>
                  ${order.customerDetails.landmark ? `Landmark: ${order.customerDetails.landmark}<br/>` : ''}
                  ${order.customerDetails.city}, ${order.customerDetails.state || 'Tamil Nadu'} - <strong>${order.customerDetails.pincode}</strong><br/>
                  📞 Phone: ${order.customerDetails.phone} ${order.customerDetails.altPhone ? `| Alt: ${order.customerDetails.altPhone}` : ''}
                </p>

                <!-- Safety Note -->
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 24px; font-size: 12px; color: #166534;">
                  🛡️ <strong>Safety First:</strong> Store crackers in a cool, dry place. Always light under adult supervision with an extended incense stick (agarbatti). Keep a bucket of water handy.
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order?orderId=${order.orderId}&phone=${order.customerDetails.phone}" 
                     style="background: #b91c1c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                    Track Your Order
                  </a>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr style="background-color: #1e293b;">
              <td style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0 0 6px 0; color: #f1f5f9; font-weight: bold;">Azhagar Crackers - S2C Crackers</p>
                <p style="margin: 0 0 6px 0;">Phone/WhatsApp: ${process.env.BUSINESS_PHONE || '+91 99444 76516'}</p>
                <p style="margin: 0;">www.s2ccrackers.com | Wish you a Joyous & Safe Festival of Lights!</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

// Admin alert email template
const generateAdminEmailHTML = (order) => {
  const itemsSummary = order.items
    .map((item) => `<li>${item.quantity}x ${item.name} - ₹${item.price * item.quantity}</li>`)
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; border: 1px solid #cbd5e1;">
      <h2 style="color: #b91c1c; margin-top: 0;">🚨 New Order Received: ${order.orderId}</h2>
      <p><strong>Customer:</strong> ${order.customerDetails.name} (${order.customerDetails.phone})</p>
      <p><strong>Total Amount:</strong> ₹${order.totalAmount} (Door Delivery)</p>
      <p><strong>Address:</strong> ${order.customerDetails.address}, ${order.customerDetails.city} - ${order.customerDetails.pincode}</p>
      <p><strong>Items:</strong></p>
      <ul>${itemsSummary}</ul>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard" style="background:#b91c1c; color:white; padding:8px 16px; text-decoration:none; border-radius:4px; font-weight:bold;">View in Admin Panel</a></p>
    </div>
  </body>
  </html>
  `;
};

// Dispatch customer confirmation email
const sendCustomerOrderConfirmationEmail = async (order) => {
  const to = order.customerDetails.email;
  const subject = `Order Confirmed: ${order.orderId} - S2C Crackers (Door Delivery)`;
  const html = generateCustomerEmailHTML(order);

  if (transporter && to) {
    try {
      const info = await transporter.sendMail({
        from: `"${process.env.BUSINESS_NAME || 'S2C Crackers'}" <${process.env.SMTP_USER || 's2ccrackers@gmail.com'}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ Order confirmation email sent to ${to} (${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ Failed to send customer email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`📧 [EMAIL PREVIEW - Customer Confirmation] To: ${to || 'No email provided'} | Order: ${order.orderId} | Total: ₹${order.totalAmount}`);
    return { success: true, preview: true };
  }
};

// Dispatch admin alert email
const sendAdminNewOrderAlertEmail = async (order) => {
  const to = process.env.ADMIN_EMAIL || 'admin@s2ccrackers.com';
  const subject = `[NEW ORDER ALERT] ${order.orderId} - ₹${order.totalAmount} from ${order.customerDetails.name}`;
  const html = generateAdminEmailHTML(order);

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"S2C Crackers Alerts" <${process.env.SMTP_USER || 'system@s2ccrackers.com'}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ Admin order alert email sent to ${to} (${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ Failed to send admin email alert:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`📧 [EMAIL PREVIEW - Admin Alert] New Order ${order.orderId} by ${order.customerDetails.name} (${order.customerDetails.phone}) for ₹${order.totalAmount}`);
    return { success: true, preview: true };
  }
};

module.exports = {
  sendCustomerOrderConfirmationEmail,
  sendAdminNewOrderAlertEmail,
};
