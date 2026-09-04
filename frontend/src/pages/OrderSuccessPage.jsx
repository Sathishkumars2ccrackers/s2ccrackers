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
} from 'lucide-react';
import { orderService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { createWhatsAppOrderUrl } from '../utils/whatsappHelper';
import FireworksCanvas from '../components/common/FireworksCanvas';
import LoadingSpinner from '../components/common/LoadingSpinner';
import logoSvg from '../assets/logo.svg';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  // Trigger festive celebratory confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#dc2626', '#ea580c', '#10b981', '#fbbf24'],
    });

    if (!order) {
      orderService
        .getByOrderId(orderId)
        .then((res) => {
          if (res.data?.success) {
            setOrder(res.data.order);
          }
        })
        .catch((err) => console.error('Failed to load order:', err))
        .finally(() => setLoading(false));
    }
  }, [orderId, order]);

  const handlePrint = () => {
    window.print();
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

  const whatsappUrl = createWhatsAppOrderUrl(order, '919442187654');

  return (
    <div className="min-h-screen bg-festival-dark py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
              Order Booked Successfully (COD)
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

          {/* Prominent WhatsApp Click-to-Chat Button */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base shadow-2xl shadow-emerald-950/80 border border-emerald-300/50 transform hover:scale-105 transition-all"
            >
              <MessageCircle className="w-6 h-6 fill-white text-emerald-600" />
              <span>Send Order via WhatsApp (Instant Confirmation)</span>
            </a>
            <p className="text-[11px] text-emerald-300/80 mt-2">
              Opens WhatsApp with pre-filled order details to send directly to our factory team.
            </p>
          </div>
        </motion.div>

        {/* Order Details & Summary Card (Printable) */}
        <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6 print-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-festival-border gap-4">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="S2C Crackers" className="h-9 w-auto" />
              <div>
                <h2 className="text-lg font-bold text-white">Order Summary & Receipt</h2>
                <p className="text-xs text-slate-400">
                  Placed on: {formatDate(order.createdAt, true)} • Payment Mode: <strong>Cash On Delivery (COD)</strong>
                </p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="no-print px-4 py-2 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Invoice</span>
            </button>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-festival-border text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Fireworks Item</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-festival-border/50">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="text-slate-200">
                    <td className="py-3 font-semibold text-white">{item.name}</td>
                    <td className="py-3 text-center text-slate-300">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-400">{formatCurrency(item.price)}</td>
                    <td className="py-3 text-right font-bold text-amber-400">
                      {formatCurrency(item.subtotal || item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-festival-border text-xs text-slate-300">
                  <td colSpan="3" className="pt-4 text-right">Items Subtotal:</td>
                  <td className="pt-4 text-right font-bold text-white">{formatCurrency(order.subtotal)}</td>
                </tr>
                <tr className="text-xs text-slate-300">
                  <td colSpan="3" className="py-1 text-right">Delivery Charge:</td>
                  <td className="py-1 text-right font-bold text-white">
                    {order.deliveryFee === 0 ? <span className="text-emerald-400">FREE</span> : formatCurrency(order.deliveryFee)}
                  </td>
                </tr>
                <tr className="text-sm font-black text-white">
                  <td colSpan="3" className="pt-3 text-right text-amber-400">Total (Pay on Delivery):</td>
                  <td className="pt-3 text-right text-amber-400 text-base">{formatCurrency(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Delivery Address Block */}
          <div className="pt-4 border-t border-festival-border grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="space-y-1">
              <h4 className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5 text-amber-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>Delivery Address</span>
              </h4>
              <p className="font-semibold text-white">{order.customerDetails?.name}</p>
              <p>{order.customerDetails?.address}</p>
              {order.customerDetails?.landmark && <p>Landmark: {order.customerDetails.landmark}</p>}
              <p>{order.customerDetails?.city}, {order.customerDetails?.state} - <strong>{order.customerDetails?.pincode}</strong></p>
              <p className="pt-1">📞 Phone: {order.customerDetails?.phone} {order.customerDetails?.altPhone ? `| Alt: ${order.customerDetails.altPhone}` : ''}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <h4 className="font-bold text-white uppercase text-[11px] flex items-center sm:justify-end gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Delivery Guarantee</span>
              </h4>
              <p>Direct dispatch from Sivakasi factory outlet.</p>
              <p>Packaging compliant with PESO safety regulations.</p>
              <p className="text-emerald-300 font-semibold pt-1">Cash on Delivery collected at doorstep.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
