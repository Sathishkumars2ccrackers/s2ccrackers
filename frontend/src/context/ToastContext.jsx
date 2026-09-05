import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 2000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastSuccess = useCallback((msg, duration = 2000) => addToast(msg, 'success', duration), [addToast]);
  const toastError = useCallback((msg, duration = 3000) => addToast(msg, 'error', duration), [addToast]);
  const toastInfo = useCallback((msg, duration = 2000) => addToast(msg, 'info', duration), [addToast]);
  const toastWarning = useCallback((msg, duration = 2500) => addToast(msg, 'warning', duration), [addToast]);

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        toastSuccess,
        toastError,
        toastInfo,
        toastWarning,
      }}
    >
      {children}
      {/* Toast Render Portal: Bottom right desktop, Bottom center mobile */}
      <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 flex flex-col items-center sm:items-end space-y-2 pointer-events-none max-w-sm w-[90%] sm:w-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-xs sm:text-sm font-semibold ${
                toast.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200 shadow-emerald-950/60 ring-1 ring-emerald-500/20'
                  : toast.type === 'error'
                  ? 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/60 ring-1 ring-rose-500/20'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/95 border-amber-500/50 text-amber-200 shadow-amber-950/60 ring-1 ring-amber-500/20'
                  : 'bg-indigo-950/95 border-indigo-500/50 text-indigo-200 shadow-indigo-950/60 ring-1 ring-indigo-500/20'
              }`}
            >
              <div className="flex-shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400" />}
              </div>
              <div className="leading-tight">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-1.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
