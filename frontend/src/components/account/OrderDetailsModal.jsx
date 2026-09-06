import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Calendar,
  MapPin,
  Phone,
  Printer,
  ExternalLink,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { createWhatsAppOrderUrl } from '../../utils/whatsappHelper';

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
      case 'Shipped':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40';
      case 'Packed':
        return 'bg-indigo-950/80 text-indigo-400 border-indigo-500/40';
      case 'Confirmed':
        return 'bg-blue-950/80 text-blue-400 border-blue-500/40';
      case 'Cancelled':
        return 'bg-rose-950/80 text-rose-400 border-rose-500/40';
      default:
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
    }
  };

  const statusSteps = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  const whatsappUrl = createWhatsAppOrderUrl(order, '919944476516');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-festival-card border border-festival-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto print-card"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-festival-border gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  {order.orderId}
                </span>
                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                    order.status
                  )}`}
                >
                  {order.status || 'Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {formatDate(order.createdAt || order.createdAtIso)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="p-2 rounded-xl bg-festival-dark border border-festival-border text-slate-300 hover:text-white transition-colors"
                title="Print Order Invoice"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-festival-dark border border-festival-border text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cancelled Order Notice */}
          {isCancelled && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2 no-print">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-extrabold text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Status: Cancelled</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Cancelled At: {order.cancelledAt ? formatDate(order.cancelledAt, true) : (order.updatedAt ? formatDate(order.updatedAt, true) : 'Not available')}
                </span>
              </div>
              <div className="text-slate-200">
                <span className="text-slate-400 font-medium">Cancellation Reason: </span>
                <span className="font-bold text-white">{order.cancellationReason || 'Not available'}</span>
              </div>
            </div>
          )}

          {/* Status Timeline Bar */}
          {!isCancelled && (
            <div className="p-4 rounded-2xl bg-festival-dark/70 border border-festival-border space-y-3 no-print">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Order Progress</h4>
              <div className="grid grid-cols-5 gap-1 text-center">
                {statusSteps.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={step} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          isDone ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-festival-border'
                        }`}
                      />
                      <span
                        className={`text-[10px] block truncate font-medium ${
                          isCurrent
                            ? 'text-amber-300 font-bold'
                            : isDone
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ordered Items List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Ordered Festival Items ({(order.items || []).length})</span>
            </h4>
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {(order.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-festival-dark/80 border border-festival-border/70 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100'}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-white flex-shrink-0">
                    {formatCurrency(item.subtotal || item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-4 rounded-2xl bg-festival-dark/60 border border-festival-border space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-bold text-white">{formatCurrency(order.subtotal || order.amount)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Delivery Charges:</span>
              <span className="font-bold text-white">
                {order.deliveryFee === 0 ? (
                  <span className="text-emerald-400 font-bold">FREE DELIVERY</span>
                ) : (
                  formatCurrency(order.deliveryFee || 0)
                )}
              </span>
            </div>
            <div className="pt-2 border-t border-festival-border flex justify-between text-sm font-black text-white">
              <span>Cash on Delivery (COD) Total:</span>
              <span className="text-amber-400 text-base">
                {formatCurrency(order.totalAmount || order.amount)}
              </span>
            </div>
          </div>

          {/* Shipping Address Details */}
          <div className="p-4 rounded-2xl bg-festival-dark/60 border border-festival-border space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Delivery Address</span>
            </h4>
            <div className="text-slate-300 leading-relaxed pl-5">
              <p className="font-bold text-white">{order.customerDetails?.name}</p>
              <p>{order.customerDetails?.phone}</p>
              <p>{order.customerDetails?.address}</p>
              <p>
                {order.customerDetails?.city}, {order.customerDetails?.state} -{' '}
                <span className="font-bold text-amber-300">{order.customerDetails?.pincode}</span>
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-festival-border flex flex-col sm:flex-row items-center gap-3 no-print">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm via WhatsApp Support</span>
            </a>

            <Link
              to={`/track-order?orderId=${order.orderId}&phone=${order.customerDetails?.phone || ''}`}
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-festival-dark hover:bg-festival-cardHover border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Live Tracking</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderDetailsModal;
