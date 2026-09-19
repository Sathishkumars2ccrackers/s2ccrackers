import { formatCurrency, formatDate, formatProductCode } from './formatters';
import { calculateItemPricing } from './pricing';
import { getProductImage, FESTIVE_PLACEHOLDER_SVG } from './imageUrlUtils';

/**
 * Programmatically generate and print a clean, dedicated A4 Tax Invoice document.
 * This runs in an isolated hidden iframe, ensuring ZERO webpage UI elements,
 * navigation bars, celebration banners, or WhatsApp buttons leak into the print/PDF.
 *
 * @param {Object} order The order data object
 */
export const printInvoiceDocument = (order) => {
  if (!order) return;

  const invoiceNumber = order.invoiceNumber || `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${(order.orderId || '0000').replace(/\D/g, '').slice(-5).padStart(5, '0')}`;

  const computedMrpTotal = order.orderMrpTotal || (order.items || []).reduce((acc, item) => {
    const unitMrp = item.mrpPrice !== undefined ? item.mrpPrice : (item.originalPrice !== undefined ? item.originalPrice : item.price);
    return acc + unitMrp * (item.quantity || 1);
  }, 0);

  const itemsSubtotal = order.orderItemsSubtotal || order.subtotal || order.totalAmount || 0;
  const finalPayable = order.orderFinalTotal || order.totalAmount || 0;
  const totalSavings = order.orderSavingsTotal !== undefined
    ? order.orderSavingsTotal
    : Math.max(0, computedMrpTotal - itemsSubtotal + (order.discountAmount || 0));

  const deliveryFee = order.deliveryFee !== undefined ? order.deliveryFee : 0;
  const slabDiscount = order.discountAmount || 0;

  // Build items rows
  const itemRowsHtml = (order.items || []).map((item, idx) => {
    const itemPricing = calculateItemPricing(item, item.quantity || 1);
    const itemImg = getProductImage(item) || FESTIVE_PLACEHOLDER_SVG;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 6px; text-align: center; color: #64748b; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 6px; text-align: center;">
          <img src="${itemImg}" alt="${itemPricing.name}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; display: block; margin: 0 auto;" />
        </td>
        <td style="padding: 8px 6px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 11px; line-height: 1.2;">${itemPricing.name}</div>
          ${itemPricing.productCode ? `<span style="display: inline-block; font-size: 9px; font-family: monospace; font-weight: 700; color: #b45309; background: #fffbeb; padding: 1px 4px; border-radius: 3px; border: 1px solid #fef3c7; margin-top: 2px;">${formatProductCode(itemPricing.productCode)}</span>` : ''}
        </td>
        <td style="padding: 8px 6px; text-align: center; font-weight: 700; color: #1e293b; font-size: 11px;">${itemPricing.quantity}</td>
        <td style="padding: 8px 6px; text-align: right; color: #64748b; font-size: 11px; text-decoration: line-through; font-family: monospace;">${formatCurrency(itemPricing.mrpPrice)}</td>
        <td style="padding: 8px 6px; text-align: center; font-size: 10px;">
          ${itemPricing.discountPercent > 0 ? `<span style="font-weight: 800; color: #065f46; background: #d1fae5; padding: 2px 5px; border-radius: 4px; border: 1px solid #a7f3d0;">${itemPricing.discountPercent}% OFF</span>` : '—'}
        </td>
        <td style="padding: 8px 6px; text-align: right; color: #047857; font-weight: 700; font-size: 11px; font-family: monospace;">
          ${itemPricing.lineSavings > 0 ? formatCurrency(itemPricing.lineSavings) : '—'}
        </td>
        <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #0f172a; font-size: 11px; font-family: monospace;">${formatCurrency(itemPricing.sellingPrice)}</td>
        <td style="padding: 8px 6px; text-align: right; font-weight: 800; color: #0B0718; font-size: 11px; font-family: monospace;">${formatCurrency(itemPricing.lineSellingPrice)}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice_${order.orderId || 'S2C'}</title>
  <style>
    @page {
      margin: 10mm 12mm;
      size: A4 portrait;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff !important;
      color: #0f172a !important;
      font-size: 11px;
      line-height: 1.35;
      padding: 15px;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .badge-box {
      background: #0B0718 !important;
      color: #ffffff !important;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 11px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      font-family: monospace;
    }
    .section-grid {
      display: table;
      width: 100%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 14px;
    }
    .section-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding: 4px 8px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .items-table th {
      background: #0B0718 !important;
      color: #ffffff !important;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 6px;
      font-weight: 700;
    }
    .summary-grid {
      display: table;
      width: 100%;
      margin-bottom: 14px;
    }
    .summary-col-left {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-right: 8px;
    }
    .summary-col-right {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-left: 8px;
    }
    .savings-box {
      background: #ecfdf5 !important;
      border: 1.5px solid #10b981;
      border-radius: 8px;
      padding: 12px;
      color: #064e3b;
    }
    .pricing-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .pricing-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .footer-box {
      border-top: 1.5px solid #e2e8f0;
      padding-top: 10px;
      text-align: center;
      color: #475569;
      font-size: 10px;
    }
    @media print {
      body {
        padding: 0;
      }
      tr, .section-grid, .summary-grid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- HEADER -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div style="font-size: 22px; font-weight: 900; color: #0B0718; text-transform: uppercase; letter-spacing: -0.5px;">
            S2C <span style="color: #f59e0b;">CRACKERS</span>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 2px;">
            Sivakasi Direct Factory Fireworks
          </div>
          <div style="font-size: 10.5px; color: #64748b; margin-top: 4px;">
            🌐 https://s2ccrackers.com &nbsp;|&nbsp; 📞 +91 99444 76516 &nbsp;|&nbsp; ✉️ s2ccrackers@gmail.com
          </div>
        </td>
        <td style="vertical-align: top; width: 240px; text-align: right;">
          <div class="badge-box">
            <div style="font-size: 10px; font-weight: 900; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; text-align: center;">
              OFFICIAL TAX INVOICE
            </div>
            <div class="meta-row">
              <span style="color: #94a3b8;">Invoice No:</span>
              <strong style="color: #ffffff;">${invoiceNumber}</strong>
            </div>
            <div class="meta-row">
              <span style="color: #94a3b8;">Order ID:</span>
              <strong style="color: #f59e0b;">${order.orderId || 'N/A'}</strong>
            </div>
            <div class="meta-row">
              <span style="color: #94a3b8;">Invoice Date:</span>
              <span>${formatDate(order.createdAt || Date.now(), false)}</span>
            </div>
            <div class="meta-row">
              <span style="color: #94a3b8;">Order Status:</span>
              <strong style="color: #34d399; text-transform: uppercase;">${order.status || 'Confirmed'}</strong>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- CUSTOMER & DELIVERY DETAILS -->
    <div class="section-grid">
      <div class="section-col" style="border-right: 1px solid #e2e8f0;">
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">
          CUSTOMER DETAILS:
        </div>
        <div style="font-size: 13px; font-weight: 800; color: #0f172a;">
          ${order.customerDetails?.name || order.customerName || 'Valued Customer'}
        </div>
        <div style="margin-top: 2px; color: #334155; font-size: 11px;">
          <div>📞 Mobile: <strong>${order.customerDetails?.phone || order.customerPhone || 'N/A'}</strong></div>
          ${order.customerDetails?.email ? `<div>✉️ Email: ${order.customerDetails.email}</div>` : ''}
        </div>
      </div>
      <div class="section-col">
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">
          DELIVERY DESTINATION:
        </div>
        <div style="color: #334155; font-size: 11px; line-height: 1.3;">
          <div>${order.customerDetails?.address || 'Standard Delivery'}</div>
          ${order.customerDetails?.landmark ? `<div style="color: #64748b; font-size: 10px;">Landmark: ${order.customerDetails.landmark}</div>` : ''}
          <div style="font-weight: 700; color: #0f172a;">${order.customerDetails?.city || 'City'}, ${order.customerDetails?.state || 'Tamil Nadu'} - ${order.customerDetails?.pincode || 'Pincode'}</div>
          <div style="color: #b45309; font-weight: 600; font-size: 10px; margin-top: 2px;">🚚 Door Delivery Available Across India</div>
        </div>
      </div>
    </div>

    <!-- PRODUCT TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 25px; text-align: center;">#</th>
          <th style="width: 45px; text-align: center;">Image</th>
          <th style="text-align: left;">Product Name & Code</th>
          <th style="width: 35px; text-align: center;">Qty</th>
          <th style="width: 65px; text-align: right;">MRP (₹)</th>
          <th style="width: 65px; text-align: center;">Discount %</th>
          <th style="width: 65px; text-align: right;">Discount (₹)</th>
          <th style="width: 65px; text-align: right;">Rate (₹)</th>
          <th style="width: 75px; text-align: right;">Subtotal (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <!-- SAVINGS & PRICING SUMMARY -->
    <div class="summary-grid">
      <div class="summary-col-left">
        <div class="savings-box">
          <div style="font-weight: 900; font-size: 13px; color: #065f46; margin-bottom: 4px;">
            🎉 Congratulations!
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #064e3b; line-height: 1.3;">
            You saved <span style="font-size: 15px; font-weight: 900; color: #047857; text-decoration: underline;">${formatCurrency(totalSavings)}</span> through factory-direct Sivakasi pricing.
          </div>
          <div style="font-size: 10px; color: #047857; margin-top: 4px;">
            Thank you for choosing S2C Crackers. 100% genuine Sivakasi quality guaranteed.
          </div>
        </div>
      </div>

      <div class="summary-col-right">
        <div class="pricing-box">
          <div class="pricing-row" style="color: #475569;">
            <span>Total MRP Value:</span>
            <span style="font-family: monospace; font-weight: 700; text-decoration: line-through;">${formatCurrency(computedMrpTotal)}</span>
          </div>
          <div class="pricing-row" style="color: #047857; background: #d1fae5; padding: 2px 4px; border-radius: 4px; font-weight: 700;">
            <span>Total Discount Saved:</span>
            <span style="font-family: monospace; font-weight: 800;">- ${formatCurrency(totalSavings)}</span>
          </div>
          ${slabDiscount > 0 ? `
            <div class="pricing-row" style="color: #b45309; background: #fffbeb; padding: 2px 4px; border-radius: 4px;">
              <span>Special Tier Discount (${order.discountPercentage || 0}%):</span>
              <span style="font-family: monospace; font-weight: 700;">- ${formatCurrency(slabDiscount)}</span>
            </div>
          ` : ''}
          <div class="pricing-row" style="color: #475569;">
            <span>Delivery Charges:</span>
            <span style="font-family: monospace; font-weight: 700;">${deliveryFee === 0 ? '<strong style="color: #047857;">FREE</strong>' : formatCurrency(deliveryFee)}</span>
          </div>
          <div class="pricing-row" style="border-top: 1.5px solid #cbd5e1; padding-top: 6px; margin-top: 4px; font-size: 13px; font-weight: 900; color: #0B0718;">
            <span>Final Payable Amount:</span>
            <span style="font-size: 16px; font-weight: 900; color: #d97706; font-family: monospace;">${formatCurrency(finalPayable)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer-box">
      <div style="font-weight: 700; color: #1e293b; font-size: 11px; margin-bottom: 2px;">
        Thank you for choosing S2C Crackers.
      </div>
      <div>
        ✨ Factory Direct Sivakasi Fireworks &nbsp;|&nbsp; 🚚 Door Delivery Available Across India &nbsp;|&nbsp; 🌐 https://s2ccrackers.com &nbsp;|&nbsp; 📞 +91 99444 76516
      </div>
      <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">
        This is a computer-generated tax invoice issued by S2C Crackers Sivakasi. No physical signature required.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Create isolated hidden iframe to print
  let iframe = document.getElementById('s2c-invoice-print-frame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 's2c-invoice-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Error invoking isolated iframe print:', e);
      // Fallback: open in dedicated new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
    }
  }, 300);
};

export default printInvoiceDocument;
