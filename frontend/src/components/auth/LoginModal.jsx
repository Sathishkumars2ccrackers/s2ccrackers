import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Phone,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle,
  Loader2,
  Flame,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoSvg from '../../assets/logo.svg';

const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, loginModalOptions, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoginModalOpen) return null;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (loginModalOptions.redirectUrl) {
        navigate(loginModalOptions.redirectUrl);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    closeLoginModal();
    if (loginModalOptions.redirectUrl) {
      navigate(loginModalOptions.redirectUrl);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLoginModal}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-festival-card border border-amber-500/30 shadow-2xl shadow-amber-950/70 z-10"
        >
          {/* Top Festive Gradient Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 animate-shimmer" />

          {/* Close Button */}
          <button
            onClick={closeLoginModal}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
            aria-label="Close Login Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header & Brand */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-festival-dark/80 border border-amber-500/20 shadow-inner mx-auto mb-1">
                <img
                  src={logoSvg}
                  alt="S2C Crackers"
                  className="h-10 w-auto object-contain"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                <span>Festival Storefront 2026</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {loginModalOptions.title || 'Welcome to S2C Crackers'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
                {loginModalOptions.subtitle || 'Sign in to manage orders, addresses and enjoy faster checkout.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3.5">
              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    {/* Google Official SVG Logo */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-festival-border w-full" />
                <span className="bg-festival-card px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  OR
                </span>
              </div>

              {/* Phone Login (Coming Soon - OTP Foundation Ready) */}
              <div className="relative group">
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-2xl bg-festival-dark/80 border border-festival-border/80 text-slate-400 font-semibold text-xs flex items-center justify-between opacity-75 cursor-not-allowed"
                >
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>Phone OTP Login</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Coming Soon
                  </span>
                </button>
              </div>

              {/* Continue as Guest */}
              <button
                type="button"
                onClick={handleGuestContinue}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors"
              >
                Continue as Guest →
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-festival-border/60 grid grid-cols-2 gap-2 text-center text-[10px] text-slate-400">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Secure Auth</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click COD Checkout</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoginModal;
