import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Eye, X, BellRing, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const OrderAlertBanner = ({ alert, onViewOrder, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!alert) return;

    setProgress(100);
    const durationMs = 15000;
    const intervalMs = 100;
    const step = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-2 border-amber-500/80 shadow-2xl shadow-red-950/80 backdrop-blur-xl"
      >
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-orange-500/10 animate-pulse pointer-events-none" />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            {/* Pulsing Icon */}
            <div className="relative mt-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 animate-bounce">
                <BellRing className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  🚨 NEW ORDER RECEIVED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {alert.orderId || 'S2C-ORDER'}
                </span>
              </div>

              <p className="text-sm font-black text-white mt-1 truncate">
                {alert.customerName || 'Online Customer'}
              </p>

              <p className="text-xs font-bold text-amber-300 mt-0.5">
                Amount:{' '}
                <span className="text-sm text-emerald-400 font-black">
                  {formatCurrency(Number(alert.amount) || 0)}
                </span>
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => onViewOrder(alert.orderId)}
                  className="flex-1 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Order</span>
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Close Cross */}
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 15s Countdown Progress Bar */}
        <div className="h-1 w-full bg-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderAlertBanner;
