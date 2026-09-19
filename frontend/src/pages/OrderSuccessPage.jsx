import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  MessageCircle,
  Printer,
  ShoppingBag,
  Truck,
  MapPin,
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { orderService } from '../services/api';
import { formatCurrency, formatDate, formatProductCode } from '../utils/formatters';
import { createWhatsAppOrderUrl } from '../utils/whatsappHelper';
import { printInvoiceDocument } from '../utils/printInvoice';
import FireworksCanvas from '../components/common/FireworksCanvas';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import InvoicePDF from '../components/invoice/InvoicePDF';
import logoSvg from '../assets/logo.svg';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(() => {
    if (location.state?.order) {
      try {
        sessionStorage.setItem(`s2c_order_${orderId}`, JSON.stringify(location.state.order));
      } catch (e) {
        // Ignore session storage quota errors
      }
      return location.state.order;
    }
    try {
      const stored = sessionStorage.getItem(`s2c_order_${orderId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // Ignore parse errors
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  // Trigger festive celebratory confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#dc2626', '#ea580c', '#10b981', '#fbbf24'],
    });
  }, []);

  const handlePrint = () => {
    if (order) {
      printInvoiceDocument(order);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-festival-dark">
        <LoadingSpinner text="Generating your festive order confirmation..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-festival-dark px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Order Details Not Found</h2>
        <p className="text-xs text-slate-400">Please check your Order ID or track order from the header.</p>
        <Link to="/" className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-full">
          Go to Home
        </Link>
      </div>
    );
  }

  const whatsappUrl = createWhatsAppOrderUrl(order, '919944476516');

  // Compute pricing totals with backward compatibility
  const computedMrpTotal = order.orderMrpTotal || (order.items || []).reduce((acc, item) => {
    const unitMrp = item.mrpPrice !== undefined ? item.mrpPrice : (item.originalPrice !== undefined ? item.originalPrice : item.price);
    return acc + unitMrp * (item.quantity || 1);
  }, 0);

  const finalTotal = order.orderFinalTotal || order.totalAmount || 0;
  const itemsSubtotal = order.orderItemsSubtotal || order.subtotal || finalTotal;
  const totalSavings = order.orderSavingsTotal !== undefined
    ? order.orderSavingsTotal
    : Math.max(0, computedMrpTotal - itemsSubtotal + (order.discountAmount || 0));

  return (
    <div className="min-h-screen bg-festival-dark py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <SEO
        title="Order Placed Successfully | S2C Crackers Sivakasi"
        description="Your festival crackers order has been received at S2C Crackers. Confirm via WhatsApp and track dispatch."
        noindex={true}
      />
      {/* Background Visual Fireworks */}
      <FireworksCanvas className="absolute inset-0 pointer-events-none opacity-40 z-0" autoLaunch={true} />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Celebration Banner Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950/90 via-festival-card to-amber-950/80 border border-amber-500/40 shadow-2xl text-center space-y-4"
        >
          {/* S2C Official Brand Logo */}
          <div className="flex justify-center pb-2">
            <img src={logoSvg} alt="S2C Crackers" className="h-12 sm:h-14 w-auto object-contain" />
          </div>

          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              Order Booked Successfully
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Thank You, {order.customerDetails?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto">
              Your festival cracker order has been received at our Sivakasi packaging warehouse.
            </p>
          </div>

          {/* Unique Order ID Box */}
          <div className="p-4 rounded-2xl bg-festival-dark/90 border border-amber-500/40 inline-block shadow-inner">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Unique Order ID</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-wide">{order.orderId}</span>
          </div>

          {/* Savings Highlight Banner */}
          {totalSavings > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 max-w-md mx-auto text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 text-emerald-300 font-extrabold text-sm sm:text-base">
                <Sparkles className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                <span>🎉 You Saved {formatCurrency(totalSavings)} On This Festival Order!</span>
              </div>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">
                Total MRP: {formatCurrency(computedMrpTotal)} • Direct Sivakasi Factory Rate Applied
              </p>
            </div>
          )}

          {/* Financial Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-2">
            <div className="p-3.5 rounded-2xl bg-festival-dark/80 border border-festival-border">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Original MRP</span>
              <span className="text-sm sm:text-base font-bold text-slate-300 line-through font-mono">
                {formatCurrency(computedMrpTotal)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-festival-dark/80 border border-festival-border">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Discount Received</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
                -{formatCurrency(totalSavings)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Total Savings</span>
              <span className="text-sm sm:text-base font-black text-emerald-300 font-mono">
                Save {formatCurrency(totalSavings)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-festival-dark/80 border border-amber-500/40">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Final Amount</span>
              <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>

          {/* Action Buttons: WhatsApp & Direct Invoice Download */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-950/80 border border-emerald-300/50 transform hover:scale-105 transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
              <span>Send Order via WhatsApp</span>
            </a>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/60 border border-amber-300/60 transform hover:scale-105 transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              <span>Download Official Tax Invoice (PDF)</span>
            </button>
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1 text-center">
            Your official GST-ready factory tax invoice is ready for download and print.
          </p>
        </motion.div>

        {/* 2. Dedicated Standalone Tax Invoice Document */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-festival-border">
          <InvoicePDF order={order} onPrint={handlePrint} />
        </div>

        {/* Navigation CTAs */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4">
          <Link
            to={`/track-order?orderId=${order.orderId}&phone=${order.customerDetails?.phone}`}
            className="px-6 py-3.5 rounded-xl bg-festival-card hover:bg-festival-cardHover border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order Status</span>
          </Link>

          <Link
            to="/products"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
