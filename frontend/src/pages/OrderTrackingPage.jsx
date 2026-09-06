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
  Phone,
  AlertCircle,
  XCircle,
  Printer,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { orderService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STEPS = [
  { id: 'Pending', label: 'Order Placed', icon: Clock },
  { id: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { id: 'Packed', label: 'Factory Packed', icon: Package },
  { id: 'Shipped', label: 'Dispatched / In Transit', icon: Truck },
  { id: 'Delivered', label: 'Delivered (COD Paid)', icon: Sparkles },
];

const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = async (searchId, searchPhone) => {
    if (!searchId && !searchPhone) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await orderService.trackOrder(searchId, searchPhone);
      if (res.data?.success && res.data.order) {
        setOrder(res.data.order);
      } else {
        setOrder(null);
        setError('No order found with the provided details. Please verify your Order ID and Mobile number.');
      }
    } catch (err) {
      setOrder(null);
      setError(err.response?.data?.message || 'No matching order found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramId = searchParams.get('orderId');
    const paramPhone = searchParams.get('phone');
    if (paramId || paramPhone) {
      setOrderId(paramId || '');
      setPhone(paramPhone || '');
      fetchTracking(paramId, paramPhone);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!orderId.trim() && !phone.trim()) {
      setError('Please provide your Order ID or Mobile Number.');
      return;
    }
    const params = new URLSearchParams();
    if (orderId.trim()) params.set('orderId', orderId.trim().toUpperCase());
    if (phone.trim()) params.set('phone', phone.trim());
    setSearchParams(params);
    fetchTracking(orderId.trim(), phone.trim());
  };

  const getStepIndex = (status) => {
    if (status === 'Cancelled') return -1;
    return STEPS.findIndex((s) => s.id === status);
  };

  const currentStepIndex = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-festival-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>Live Dispatch Status</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Track Your Festival Order</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Enter your <strong>Order ID</strong> (e.g. S2C-20260829-584231) or <strong>Registered Mobile Number</strong> to track Sivakasi dispatch.
          </p>
        </div>

        {/* Search Bar Form */}
        <div className="bg-festival-card border border-festival-border p-6 rounded-3xl shadow-xl">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Order ID</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                placeholder="e.g. S2C-20260829-123456"
                className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 9876543210"
                className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Track Order</span>
              </button>
            </div>
          </form>
        </div>

        {loading && <LoadingSpinner text="Locating your order in Sivakasi database..." />}

        {error && searched && !loading && (
          <div className="p-6 rounded-3xl bg-rose-950/60 border border-rose-500/40 text-center space-y-2">
            <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Order Not Found</h3>
            <p className="text-xs text-rose-200">{error}</p>
          </div>
        )}

        {/* Order Details & Timeline */}
        {order && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Timeline Stepper */}
            <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-festival-border gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tracking Order</span>
                  <h2 className="text-xl font-black text-amber-400 font-mono">{order.orderId}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : order.status === 'Cancelled'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}
                  >
                    Status: {order.status}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="no-print px-3 py-1 rounded-lg bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs text-slate-300 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    Print
                  </button>
                </div>
              </div>

              {/* Progress Stepper Line */}
              {order.status === 'Cancelled' ? (
                <div className="p-6 sm:p-8 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-4">
                  <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-white">Order Cancelled</h3>
                    <p className="text-xs text-rose-200">
                      This order has been cancelled and its reserved stock has been returned to inventory.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-festival-dark/80 border border-rose-500/30 text-xs max-w-md mx-auto text-left space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
                      <span className="font-semibold text-rose-300 uppercase tracking-wider text-[10px]">Cancellation Details</span>
                      <span>
                        Cancelled On: {order.cancelledAt ? formatDate(order.cancelledAt, true) : (order.updatedAt ? formatDate(order.updatedAt, true) : 'Not available')}
                      </span>
                    </div>
                    <p className="text-slate-200 pt-0.5">
                      <span className="text-slate-400 font-medium">Reason: </span>
                      <span className="font-bold text-white">{order.cancellationReason || 'Not available'}</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    If you have questions regarding this cancellation, please contact our Sivakasi WhatsApp customer support.
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  <div className="relative flex items-center justify-between">
                    {/* Background Progress Bar */}
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
                  <h4 className="text-xs font-bold text-slate-300 uppercase">Status History Updates</h4>
                  <div className="space-y-2">
                    {order.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs bg-festival-dark/80 p-3 rounded-xl border border-festival-border/50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-amber-300">{history.status}</span>
                            <span className="text-[10px] text-slate-400">{formatDate(history.timestamp, true)}</span>
                          </div>
                          {history.note && <p className="text-slate-300 mt-0.5">{history.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ordered Products & Address Card */}
            <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Products */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase border-b border-festival-border pb-2">
                  Items in this Package
                </h3>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-festival-border/40">
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                      <span className="font-bold text-amber-400">{formatCurrency(item.subtotal || item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between text-xs font-black text-white border-t border-festival-border">
                  <span>Grand Total (Pay on Delivery):</span>
                  <span className="text-amber-400 text-sm">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase border-b border-festival-border pb-2">
                  Destination Address
                </h3>
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white text-sm">{order.customerDetails?.name}</p>
                  <p>{order.customerDetails?.address}</p>
                  {order.customerDetails?.landmark && <p>Landmark: {order.customerDetails.landmark}</p>}
                  <p>{order.customerDetails?.city}, {order.customerDetails?.state} - <strong>{order.customerDetails?.pincode}</strong></p>
                  <p className="pt-1">📞 Phone: {order.customerDetails?.phone}</p>
                  <div className="mt-3 p-3 rounded-xl bg-festival-dark border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>Payment Mode: Cash On Delivery (COD)</span>
                  </div>
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
