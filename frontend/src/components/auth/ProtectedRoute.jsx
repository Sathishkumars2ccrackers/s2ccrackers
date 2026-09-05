import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Lock, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading, openLoginModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal({
        title: 'Sign In Required',
        subtitle: 'Please sign in to access your account dashboard and order history.',
        redirectUrl: location.pathname + location.search,
      });
    }
  }, [loading, user, location, openLoginModal]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <Flame className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-sm font-bold text-amber-200 animate-pulse">Restoring your festival session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-festival-card border border-festival-border text-center space-y-6 shadow-2xl shadow-amber-950/40">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Sign In to Continue</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              You need to sign in with your Google account to view your personal account dashboard, saved addresses, and festival orders.
            </p>
          </div>

          <button
            onClick={() =>
              openLoginModal({
                title: 'Sign In Required',
                subtitle: 'Please sign in to access your orders and account.',
                redirectUrl: location.pathname + location.search,
              })
            }
            className="w-full py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-950/50 transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
