import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Sparkles, Tag, Flame, CheckCircle2, Percent } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';

const FloatingCartBar = () => {
  const { totalItemsCount, cartSubtotal, totalSavings, openCart } = useCart();
  const {
    minimumOrderAmount,
    freeDeliveryThreshold,
    cartProgressMessage,
    calculateDiscount,
    getFreeDeliveryProgress,
  } = useSettings();
  const location = useLocation();

  // Hide floating cart on cart, checkout, order-success, and admin pages
  const isHiddenPage =
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/cart') ||
    location.pathname.startsWith('/order-success') ||
    location.pathname.startsWith('/admin');

  if (totalItemsCount === 0 || isHiddenPage) {
    return null;
  }

  const { discountPercentage, discountAmount, nextSlab, amountNeededForNextSlab } = calculateDiscount(cartSubtotal);
  const { progressPercent: freeDeliveryProgress, amountNeeded: neededForFreeDelivery, isUnlocked: isFreeDeliveryReached } =
    getFreeDeliveryProgress(cartSubtotal);

  const isMinOrderReached = cartSubtotal >= minimumOrderAmount;
  const finalPayable = Math.max(0, cartSubtotal - discountAmount);
  const combinedSavings = totalSavings + discountAmount;

  let progressPercent = 0;
  let progressMessage = '';
  let targetDisplay = '';

  if (!isMinOrderReached) {
    progressPercent = minimumOrderAmount > 0 ? Math.min(100, Math.round((cartSubtotal / minimumOrderAmount) * 100)) : 100;
    const remaining = minimumOrderAmount - cartSubtotal;
    progressMessage = `Add ${formatCurrency(remaining)} more to reach minimum order`;
    targetDisplay = `${formatCurrency(cartSubtotal)} / ${formatCurrency(minimumOrderAmount)}`;
  } else if (nextSlab && amountNeededForNextSlab > 0 && amountNeededForNextSlab <= (freeDeliveryThreshold - cartSubtotal)) {
    progressPercent = Math.min(100, Math.round((cartSubtotal / nextSlab.minAmount) * 100));
    progressMessage = `Add ${formatCurrency(amountNeededForNextSlab)} more for ${nextSlab.discountPercentage}% Special Discount! 🎁`;
    targetDisplay = `${formatCurrency(cartSubtotal)} / ${formatCurrency(nextSlab.minAmount)}`;
  } else if (!isFreeDeliveryReached) {
    progressPercent = freeDeliveryProgress;
    progressMessage = `Add ${formatCurrency(neededForFreeDelivery)} more for FREE Delivery! 🎉`;
    targetDisplay = `${formatCurrency(cartSubtotal)} / ${formatCurrency(freeDeliveryThreshold)}`;
  } else {
    progressPercent = 100;
    progressMessage = discountPercentage > 0
      ? `🎉 FREE Delivery + ${discountPercentage}% Special Discount Unlocked!`
      : '🎉 FREE Delivery Unlocked across India!';
    targetDisplay = `${formatCurrency(cartSubtotal)}`;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none flex justify-center"
      >
        <div
          onClick={openCart}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openCart();
            }
          }}
          className="pointer-events-auto w-full max-w-3xl bg-gradient-to-r from-festival-card via-[#1c122e] to-festival-card border border-amber-500/50 hover:border-amber-400 rounded-2xl sm:rounded-3xl p-3 sm:py-3 sm:px-5 shadow-2xl shadow-amber-950/80 backdrop-blur-xl cursor-pointer group transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] select-none"
        >
          {/* Progress Bar Strip */}
          <div className="w-full bg-festival-dark/90 rounded-full h-1.5 overflow-hidden mb-2 sm:mb-2.5 border border-festival-border/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-400 rounded-full shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-2.5 sm:gap-4">
            {/* Left: Item Count & Savings & Target Progress */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 text-white flex-shrink-0 shadow-md group-hover:rotate-6 transition-transform">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-4 sm:w-5 h-4 sm:h-5 bg-white text-red-700 font-black text-[10px] sm:text-xs rounded-full flex items-center justify-center shadow">
                  {totalItemsCount}
                </span>
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-white">
                    {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
                  </span>
                  {combinedSavings > 0 && (
                    <span className="text-[10px] sm:text-xs font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span>Saved {formatCurrency(combinedSavings)}</span>
                    </span>
                  )}
                  <span className="hidden md:inline-block text-[11px] font-mono text-amber-300/90 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {targetDisplay}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-300 truncate font-medium flex items-center gap-1">
                  {isFreeDeliveryReached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
                  )}
                  <span className="truncate">{progressMessage}</span>
                </p>
              </div>
            </div>

            {/* Right: Cart Value & View Cart Button */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-right hidden xs:block">
                <span className="text-[10px] text-amber-200/80 uppercase font-semibold block leading-tight">
                  Cart Total
                </span>
                <span className="text-sm sm:text-base font-black text-amber-400">
                  {formatCurrency(finalPayable)}
                </span>
              </div>

              <button
                type="button"
                className="py-2 px-3.5 sm:py-2.5 sm:px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 group-hover:from-red-500 group-hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-950/60 transition-all flex items-center gap-1.5"
              >
                <span>View Cart</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingCartBar;
