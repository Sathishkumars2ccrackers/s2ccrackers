import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Truck,
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  Printer,
  ShieldCheck,
  Sparkles,
  Lock,
  UserCheck,
  CreditCard,
} from 'lucide-react';
import { orderService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STEPS = [
  { id: 'Pending', label: 'Order Placed', icon: Clock, desc: 'Received at Sivakasi factory' },
  { id: 'Confirmed', label: 'Confirmed', icon: CheckCircle2, desc: 'Order verified & queued' },
  { id: 'Packed', label: 'Factory Packed', icon: Package, desc: 'Moisture-barrier cartons' },
  { id: 'Shipped', label: 'Dispatched / In Transit', icon: Truck, desc: 'Handed to surface logistics' },
  { id: 'Delivered', label: 'Delivered', icon: Sparkles, desc: 'Delivered to doorstep' },
];

const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateInputs = (id, ph) => {
    const errors = {};
    const cleanId = (id || '').trim();
    const cleanPh = (ph || '').replace(/\D/g, '');

    if (!cleanId) {
      errors.orderId = 'Order ID is required.';
    }

    if (!cleanPh) {
      errors.phone = 'Phone Number is required.';
    } else if (cleanPh.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    return { errors, isValid: Object.keys(errors).length === 0, cleanId, cleanPh };
  };

  const fetchTracking = async (searchId, searchPhone) => {
    const { errors, isValid, cleanId, cleanPh } = validateInputs(searchId, searchPhone);
    if (!isValid) {
      setFieldErrors(errors);
      setError('Order not found. Please verify your Order ID and Phone Number.');
      setSearched(true);
      setOrder(null);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await orderService.trackOrder(cleanId.toUpperCase(), cleanPh);
      if (res.data?.success && res.data.order) {
        setOrder(res.data.order);
        setError('');
      } else {
        setOrder(null);
        setError(res.data?.message || 'Order not found. Please verify your Order ID and Phone Number.');
      }
    } catch (err) {
      setOrder(null);
      setError(
        err.response?.data?.message ||
          'Order not found. Please verify your Order ID and Phone Number.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramId = searchParams.get('orderId');
    const paramPhone = searchParams.get('phone');

    if (paramId) {
      setOrderId(paramId);
    }
    if (paramPhone) {
      setPhone(paramPhone);
    }

    // Auto-trigger only when BOTH orderId and a valid 10-digit phone number are present
    if (paramId && paramPhone) {
      const cleanPh = paramPhone.replace(/\D/g, '');
      if (paramId.trim() && cleanPh.length === 10) {
        fetchTracking(paramId.trim(), cleanPh);
      }
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const { errors, isValid, cleanId, cleanPh } = validateInputs(orderId, phone);
    setFieldErrors(errors);

    if (!isValid) {
      setError('Order not found. Please verify your Order ID and Phone Number.');
      setSearched(true);
      setOrder(null);
      return;
    }

    const params = new URLSearchParams();
    params.set('orderId', cleanId.toUpperCase());
    params.set('phone', cleanPh);
    setSearchParams(params);

    fetchTracking(cleanId, cleanPh);
  };

  const getStepIndex = (status) => {
    if (status === 'Cancelled') return -1;
    return STEPS.findIndex((s) => s.id === status);
  };

  const currentStepIndex = order ? getStepIndex(order.status || order.orderStatus) : 0;

  return (
    <div className="min-h-screen bg-festival-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Order Verification</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Track Your Festival Order</h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            For privacy and security, enter your <strong>Order ID</strong> along with your <strong>Registered Mobile Number</strong> (Primary or Alternate) to view live Sivakasi dispatch status.
          </p>
        </div>

        {/* Search Bar Form */}
        <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order ID Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                  <span>Order ID <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">e.g. S2C-2026-001234</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => {
                      setOrderId(e.target.value.toUpperCase());
                      if (fieldErrors.orderId) setFieldErrors((prev) => ({ ...prev, orderId: null }));
                    }}
                    placeholder="Enter your Order ID"
                    className={`w-full bg-festival-dark border ${
                      fieldErrors.orderId ? 'border-rose-500/70 focus:border-rose-500' : 'border-festival-border focus:border-amber-500'
                    } rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder:font-sans placeholder:text-slate-500 focus:outline-none transition-colors`}
                  />
                </div>
                {fieldErrors.orderId && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.orderId}</span>
                  </p>
                )}
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                  <span>Registered Mobile Number <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">10 digits (Primary / Alt)</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ''));
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }));
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full bg-festival-dark border ${
                      fieldErrors.phone ? 'border-rose-500/70 focus:border-rose-500' : 'border-festival-border focus:border-amber-500'
                    } rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button & Security Note */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Protected by 2-Factor Order ID + Customer Phone Verification</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Verify & Track Order</span>
              </button>
            </div>
          </form>
        </div>

        {/* Loading Spinner */}
        {loading && <LoadingSpinner text="Verifying credentials & retrieving live dispatch status..." />}

        {/* Error Banner */}
        {error && searched && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-rose-950/60 border border-rose-500/40 text-center space-y-3"
          >
            <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Tracking Verification Failed</h3>
            <p className="text-xs sm:text-sm text-rose-200 max-w-md mx-auto">{error}</p>
            <p className="text-[11px] text-slate-400 pt-1">
              Please ensure your Order ID and registered phone number match the details provided during checkout.
            </p>
          </motion.div>
        )}

        {/* Verified Order Details & Timeline */}
        {order && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Main Status & Stepper Card */}
            <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-festival-border gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      Verified Customer Order
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-amber-400 font-mono tracking-wide">{order.orderId}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customer: <strong className="text-white">{order.customerName || order.customerDetails?.name}</strong> • Placed On: {formatDate(order.orderDate || order.createdAt, true)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : order.status === 'Cancelled'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}
                  >
                    Status: {order.status || order.orderStatus}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="no-print px-3.5 py-1.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Dispatch & Courier Status Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-festival-dark/80 border border-festival-border">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Dispatch Status</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    {order.dispatchStatus || order.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Courier / Transport Partner</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    {order.courierName || 'Sivakasi Surface Transport'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    {order.trackingNumber ? 'Tracking / Waybill #' : 'Estimated Delivery'}
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono mt-0.5 block">
                    {order.trackingNumber || order.estimatedDelivery || '3-5 Business Days'}
                  </span>
                </div>
              </div>

              {/* Cancelled State View */}
              {order.status === 'Cancelled' ? (
                <div className="p-6 sm:p-8 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-4">
                  <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-white">Order Cancelled</h3>
                    <p className="text-xs text-rose-200">
                      This order has been cancelled and inventory reserved for this booking has been returned to stock.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-festival-dark/80 border border-rose-500/30 text-xs max-w-md mx-auto text-left space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
                      <span className="font-semibold text-rose-300 uppercase tracking-wider text-[10px]">
                        Cancellation Reason
                      </span>
                      <span>
                        Cancelled On: {order.cancelledAt ? formatDate(order.cancelledAt, true) : 'Recorded'}
                      </span>
                    </div>
                    <p className="text-slate-200 pt-0.5 font-bold text-white">
                      {order.cancellationReason || 'Order cancelled upon request'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Stepper Progress Bar */
                <div className="py-4">
                  <div className="relative flex items-center justify-between">
                    {/* Background Track */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-festival-dark z-0" />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 z-0"
                      style={{
                        width: `${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}%`,
                      }}
                    />

                    {STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;

                      return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-10 sm:w-12 h-10 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-950/50'
                                : 'bg-festival-dark text-slate-500 border border-festival-border'
                            } ${isCurrent ? 'ring-4 ring-amber-400/30 animate-pulse' : ''}`}
                          >
                            <Icon className="w-5 sm:w-6 h-5 sm:h-6" />
                          </div>
                          <span
                            className={`text-[10px] sm:text-xs font-bold mt-2 text-center max-w-[80px] sm:max-w-[100px] leading-tight ${
                              isCompleted ? 'text-white' : 'text-slate-500'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status History Logs */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="pt-4 border-t border-festival-border space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Status History Updates</span>
                  </h4>
                  <div className="space-y-2">
                    {order.statusHistory.map((history, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-xs bg-festival-dark/80 p-3 rounded-xl border border-festival-border/50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-amber-300">{history.status}</span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(history.timestamp, true)}
                            </span>
                          </div>
                          {history.note && <p className="text-slate-300 mt-0.5">{history.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ordered Products & Delivery Address Card */}
            <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Products Breakdown */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase border-b border-festival-border pb-2 flex items-center justify-between">
                  <span>Ordered Fireworks</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {(order.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0)} items total
                  </span>
                </h3>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs pb-2.5 border-b border-festival-border/40"
                    >
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg border border-festival-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-festival-dark flex items-center justify-center text-slate-500 border border-festival-border">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Qty: <strong className="text-slate-200">{item.quantity}</strong> × {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-amber-400 font-mono">
                        {formatCurrency(item.subtotal || item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Amount Totals */}
                <div className="pt-2 space-y-1.5 border-t border-festival-border text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-white font-mono">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Delivery Charge:</span>
                    <span className="font-bold text-white">
                      {order.deliveryFee === 0 ? (
                        <span className="text-emerald-400 uppercase font-black text-[11px]">FREE</span>
                      ) : (
                        formatCurrency(order.deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between text-sm font-black text-white border-t border-festival-border">
                    <span className="text-amber-400">Grand Total:</span>
                    <span className="text-amber-400 text-base font-mono">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Destination Address (Phone numbers withheld for privacy) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase border-b border-festival-border pb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Delivery Destination</span>
                </h3>

                <div className="text-xs text-slate-300 space-y-1.5 bg-festival-dark/60 p-4 rounded-2xl border border-festival-border/60">
                  <p className="font-bold text-white text-sm">{order.customerDetails?.name || order.customerName}</p>
                  <p>{order.customerDetails?.address}</p>
                  {order.customerDetails?.landmark && (
                    <p className="text-slate-400">Landmark: {order.customerDetails.landmark}</p>
                  )}
                  <p className="font-semibold text-slate-200">
                    {order.customerDetails?.city}, {order.customerDetails?.state || 'Tamil Nadu'} - <strong>{order.customerDetails?.pincode}</strong>
                  </p>

                  <div className="mt-4 pt-3 border-t border-festival-border/60 flex items-center gap-2 text-emerald-400">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span className="font-bold">Payment & Delivery: {order.paymentMethod || 'Door Delivery Available'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 uppercase text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Customer Privacy Guarantee</span>
                  </div>
                  <p>
                    Customer phone numbers and private details are securely masked on public tracking pages.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
