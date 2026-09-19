import React from 'react';
import {
  Printer,
  Sparkles,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  Package,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { formatCurrency, formatDate, formatProductCode } from '../../utils/formatters';
import { calculateItemPricing } from '../../utils/pricing';
import { getProductImage, FESTIVE_PLACEHOLDER_SVG } from '../../utils/imageUrlUtils';
import logoSvg from '../../assets/logo.svg';

/**
 * Professional Tax Invoice Component
 * S2C CRACKERS – Sivakasi Direct Factory Fireworks
 *
 * Theme Colors:
 * - Gold / Amber: #F59E0B
 * - Dark Navy: #0B0718
 * - Pure White & Slate Accents
 */
const ProfessionalInvoice = ({ order, onPrint, isModal = false }) => {
  if (!order) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // Generate official Invoice Number
  const invoiceNumber = order.invoiceNumber || `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${(order.orderId || '0000').replace(/\D/g, '').slice(-5).padStart(5, '0')}`;

  // Computations
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

  return (
    <div className={`professional-invoice-wrapper font-sans text-slate-900 bg-white ${isModal ? 'p-0' : 'p-4 sm:p-8'}`}>
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print flex items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Official Tax Invoice Preview
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Main Printable Invoice Sheet */}
      <div id="printable-invoice" className="printable-invoice bg-white border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-6">
        {/* 1. INVOICE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b-2 border-amber-500">
          {/* Company Brand */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="S2C Crackers" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B0718] uppercase">
                  S2C <span className="text-amber-500">CRACKERS</span>
                </h1>
                <p className="text-[11px] font-bold text-slate-600 tracking-wide uppercase">
                  Sivakasi Direct Factory Fireworks
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-2 font-medium">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                https://s2ccrackers.com
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                +91 99444 76516
              </span>
            </div>
          </div>

          {/* Invoice Meta Box */}
          <div className="sm:text-right bg-[#0B0718] text-white p-4 rounded-xl min-w-[220px] shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
              ORIGINAL TAX INVOICE
            </span>
            <div className="text-xs font-mono space-y-1">
              <div>
                <span className="text-slate-400">Invoice No: </span>
                <span className="font-bold text-white">{invoiceNumber}</span>
              </div>
              <div>
                <span className="text-slate-400">Order ID: </span>
                <span className="font-bold text-amber-400">{order.orderId}</span>
              </div>
              <div>
                <span className="text-slate-400">Order Date: </span>
                <span className="text-slate-200">{formatDate(order.createdAt, false)}</span>
              </div>
              <div>
                <span className="text-slate-400">Status: </span>
                <span className="font-bold text-emerald-400 uppercase">{order.status || 'Confirmed'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CUSTOMER DETAILS & BILL TO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              BILLED & DELIVERED TO:
            </span>
            <h2 className="text-sm font-black text-slate-900">
              {order.customerDetails?.name || order.customerName || 'Valued Customer'}
            </h2>
            <div className="text-slate-700 mt-1 space-y-0.5">
              <p className="font-medium">📞 {order.customerDetails?.phone || order.customerPhone || 'N/A'}</p>
              {order.customerDetails?.email && (
                <p className="text-slate-600">✉️ {order.customerDetails.email}</p>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              DELIVERY DESTINATION ADDRESS:
            </span>
            <div className="text-slate-700 space-y-0.5 leading-relaxed">
              <p className="font-medium">{order.customerDetails?.address || 'Standard Delivery'}</p>
              {order.customerDetails?.landmark && (
                <p className="text-slate-500 text-[11px]">Landmark: {order.customerDetails.landmark}</p>
              )}
              <p className="font-bold text-slate-900">
                {order.customerDetails?.city || 'City'}, {order.customerDetails?.state || 'Tamil Nadu'} - {order.customerDetails?.pincode || 'Pincode'}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold pt-1">
                Dispatch Mode: Door Delivery Available Across India
              </p>
            </div>
          </div>
        </div>

        {/* 3. PRODUCT TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#0B0718] text-white uppercase text-[10px] font-bold tracking-wider">
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3 w-12 text-center">Item</th>
                <th className="p-3">Product Name & Code</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">MRP (₹)</th>
                <th className="p-3 text-center">Disc %</th>
                <th className="p-3 text-right">You Save (₹)</th>
                <th className="p-3 text-right">Rate (₹)</th>
                <th className="p-3 text-right">Subtotal (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(order.items || []).map((item, idx) => {
                const itemPricing = calculateItemPricing(item, item.quantity || 1);
                const itemImg = getProductImage(item);

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-2 text-center">
                      <img
                        src={itemImg || FESTIVE_PLACEHOLDER_SVG}
                        alt={itemPricing.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 mx-auto"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FESTIVE_PLACEHOLDER_SVG;
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 leading-snug">{itemPricing.name}</div>
                      {itemPricing.productCode && (
                        <span className="inline-block text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5">
                          {formatProductCode(itemPricing.productCode)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800 font-mono">
                      {itemPricing.quantity}
                    </td>
                    <td className="p-3 text-right text-slate-500 font-mono line-through">
                      {formatCurrency(itemPricing.mrpPrice)}
                    </td>
                    <td className="p-3 text-center">
                      {itemPricing.discountPercent > 0 ? (
                        <span className="inline-block text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                          {itemPricing.discountPercent}% OFF
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-emerald-700 font-bold font-mono">
                      {itemPricing.lineSavings > 0 ? formatCurrency(itemPricing.lineSavings) : '—'}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(itemPricing.sellingPrice)}
                    </td>
                    <td className="p-3 text-right font-black text-[#0B0718] font-mono">
                      {formatCurrency(itemPricing.lineSellingPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. PRICING SUMMARY & SAVINGS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-start">
          {/* SAVINGS CARD (Left / Highlight) */}
          <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-5 text-emerald-950 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-base">
              <Sparkles className="w-5 h-5 text-emerald-600 fill-emerald-500" />
              <span>🎉 Congratulations!</span>
            </div>
            <p className="text-sm font-bold text-emerald-900">
              You saved <span className="text-emerald-700 font-black text-lg underline decoration-emerald-500">{formatCurrency(totalSavings)}</span> through factory-direct Sivakasi pricing.
            </p>
            <p className="text-xs text-emerald-800/90 pt-1">
              Thank you for choosing S2C Crackers. 100% genuine Sivakasi quality guaranteed.
            </p>
          </div>

          {/* PRICING BREAKDOWN (Right) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Total MRP Value:</span>
              <span className="font-mono font-bold text-slate-500 line-through text-sm">
                {formatCurrency(computedMrpTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-700 bg-emerald-100/70 p-2 rounded-lg font-bold">
              <span>Total Discount Saved:</span>
              <span className="font-mono font-black text-sm text-emerald-800">
                - {formatCurrency(totalSavings)}
              </span>
            </div>

            {slabDiscount > 0 && (
              <div className="flex justify-between items-center text-amber-800 bg-amber-50 p-2 rounded-lg font-semibold">
                <span>Special Tier Discount ({order.discountPercentage || 0}%):</span>
                <span className="font-mono font-bold">- {formatCurrency(slabDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Shipping & Delivery:</span>
              <span className="font-mono font-bold text-slate-900">
                {deliveryFee === 0 ? <span className="text-emerald-700 uppercase font-black">FREE</span> : formatCurrency(deliveryFee)}
              </span>
            </div>

            <div className="pt-3 border-t-2 border-slate-300 flex justify-between items-center text-slate-950">
              <span className="text-sm font-black uppercase">Final Payable Amount:</span>
              <span className="text-xl font-black text-amber-600 font-mono">
                {formatCurrency(finalPayable)}
              </span>
            </div>
          </div>
        </div>

        {/* 5. FOOTER */}
        <div className="pt-6 border-t-2 border-slate-200 text-center space-y-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-semibold text-slate-700">
            <span>✨ Factory Direct Sivakasi Pricing</span>
            <span>🚚 Door Delivery Available Across India</span>
            <span>🌐 https://s2ccrackers.com</span>
            <span>📞 +91 99444 76516</span>
          </div>
          <p className="text-[10px] text-slate-400">
            This is a computer-generated tax invoice issued by S2C Crackers Sivakasi. No physical signature required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalInvoice;
