import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

const MIN_ORDER_AMOUNT = 500;
const FREE_DELIVERY_THRESHOLD = 3000;

const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartSubtotal,
    totalSavings,
    totalItemsCount,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const freeDeliveryProgress = Math.min(100, Math.round((cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartSubtotal);
  const isMinOrderMet = cartSubtotal >= MIN_ORDER_AMOUNT;

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-festival-card border-l border-festival-gold/30 shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-festival-border flex items-center justify-between bg-festival-dark/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Your Festival Cart</h3>
                    <p className="text-xs text-slate-400">
                      {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCart}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Delivery Progress Indicator */}
              <div className="px-5 py-3 bg-amber-950/40 border-b border-amber-500/20">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  {amountNeededForFreeDelivery > 0 ? (
                    <span className="text-amber-200">
                      Add <strong className="text-amber-400">{formatCurrency(amountNeededForFreeDelivery)}</strong> more for <strong>FREE DELIVERY</strong>!
                    </span>
                  ) : (
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Congratulations! You unlocked FREE Delivery!
                    </span>
                  )}
                  <span className="text-slate-400 text-[11px]">{freeDeliveryProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-festival-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>

              {/* Drawer Content - Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-festival-dark border border-dashed border-festival-border flex items-center justify-center text-slate-500">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base">Your cart is empty</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Add sparklers, flower pots, 1000 wala, or deluxe festival gift boxes to start your festival order!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        closeCart();
                        navigate('/products');
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs rounded-full shadow-lg"
                    >
                      Browse Sivakasi Crackers
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-3.5 rounded-2xl bg-festival-dark/80 border border-festival-border flex gap-3.5 items-center group"
                    >
                      {/* Product Image */}
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=200'}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover border border-amber-500/20 flex-shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-xs leading-snug truncate">{item.name}</h4>
                        <p className="text-[11px] text-amber-400 font-medium mt-0.5">{item.packSize}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-sm font-extrabold text-white">{formatCurrency(item.price)}</span>
                          {item.originalPrice > item.price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center border border-festival-border rounded-lg bg-festival-card">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-white min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Drawer Footer - Price & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-festival-border bg-festival-dark/95 space-y-4">
                  {/* Summary Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Items Subtotal:</span>
                      <span className="font-bold text-white">{formatCurrency(cartSubtotal)}</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-emerald-400 font-medium">
                        <span>Festival Direct Factory Savings:</span>
                        <span>-{formatCurrency(totalSavings)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Shipping:</span>
                      <span>{cartSubtotal >= FREE_DELIVERY_THRESHOLD ? 'FREE' : 'Calculated at checkout'}</span>
                    </div>
                    <div className="pt-2 border-t border-festival-border flex justify-between text-sm font-bold text-white">
                      <span>Estimated Total:</span>
                      <span className="text-amber-400 text-base">{formatCurrency(cartSubtotal)}</span>
                    </div>
                  </div>

                  {/* Min Order Warning */}
                  {!isMinOrderMet && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs text-center">
                      Minimum order amount is <strong>{formatCurrency(MIN_ORDER_AMOUNT)}</strong>. Add {formatCurrency(MIN_ORDER_AMOUNT - cartSubtotal)} more to proceed.
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    disabled={!isMinOrderMet}
                    onClick={handleCheckoutClick}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 font-medium text-center">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Door Delivery Available • 100% Safe Factory Packaging</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
