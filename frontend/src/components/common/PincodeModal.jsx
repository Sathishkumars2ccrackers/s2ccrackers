import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2, XCircle, X, Search, Loader2 } from 'lucide-react';
import { pincodeService } from '../../services/api';
import { useCart } from '../../context/CartContext';

const PincodeModal = ({ isOpen, onClose }) => {
  const { pincodeInfo, setPincodeInfo } = useCart();
  const [inputPin, setInputPin] = useState(pincodeInfo?.pincode || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e?.preventDefault();
    if (!inputPin || inputPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(inputPin)) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await pincodeService.checkPincode(inputPin);
      if (res.data.success) {
        setResult(res.data);
        if (res.data.serviceable) {
          setPincodeInfo(res.data);
        }
      } else {
        setError(res.data.message || 'Unable to verify pincode.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to delivery server.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-festival-card border border-festival-gold/30 rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
        >
          {/* Top Gold Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-orange-500" />

          <div className="flex items-center justify-between pb-4 border-b border-festival-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Delivery Pincode Checker</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-3 mb-4">
            Enter your 6-digit delivery PIN code to verify direct dispatch from Sivakasi and estimated delivery time.
          </p>

          <form onSubmit={handleCheck} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={inputPin}
                onChange={(e) => {
                  setInputPin(e.target.value.replace(/[^0-9]/g, ''));
                  setError('');
                  setResult(null);
                }}
                placeholder="Enter 6-digit Pincode (e.g. 600001, 626123)"
                className="w-full bg-festival-dark/80 border border-festival-border rounded-xl px-4 py-3 text-white text-base font-semibold tracking-wider placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || inputPin.length !== 6}
                className="absolute right-2 top-2 bottom-2 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Check
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-lg"
              >
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                  result.serviceable
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {result.serviceable ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Delivery Available to {result.city}!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-rose-300">Location Not Serviceable Online</span>
                    </>
                  )}
                </div>
                <p>{result.message}</p>
                {result.serviceable && (
                  <div className="pt-2 mt-2 border-t border-emerald-500/20 flex justify-between font-semibold">
                    <span>Est. Delivery: {result.estimatedDays}</span>
                    <span>Fee: {result.deliveryFee === 0 ? 'FREE' : `₹${result.deliveryFee}`}</span>
                  </div>
                )}
              </motion.div>
            )}

            {result?.serviceable && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-festival-cardHover border border-amber-500/40 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                Continue Shopping
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PincodeModal;
