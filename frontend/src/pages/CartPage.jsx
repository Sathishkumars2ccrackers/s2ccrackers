import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';

const MIN_ORDER_AMOUNT = 500;
const FREE_DELIVERY_THRESHOLD = 3000;

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartSubtotal,
    totalSavings,
    totalItemsCount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const isMinOrderMet = cartSubtotal >= MIN_ORDER_AMOUNT;
  const freeDeliveryProgress = Math.min(100, Math.round((cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartSubtotal);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-festival-dark px-4 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-festival-card border border-dashed border-festival-border flex items-center justify-center text-slate-500">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Festival Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
          Explore our Sivakasi fireworks catalogue, sparklers, flower pots, 1000 wala, and deluxe gift boxes!
        </p>
        <Link
          to="/products"
          className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-sm rounded-full shadow-lg"
        >
          Browse All Crackers
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-festival-dark py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-festival-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-amber-400" />
              <span>Shopping Cart ({totalItemsCount} items)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Review your festival cracker items before placing your COD order.</p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-200">
            {amountNeededForFreeDelivery > 0 ? (
              <span>
                Add <strong className="text-amber-400">{formatCurrency(amountNeededForFreeDelivery)}</strong> more for <strong>FREE SIVAKASI DELIVERY</strong>!
              </span>
            ) : (
              <span className="text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                You have qualified for 100% FREE Delivery!
              </span>
            )}
            <span>{freeDeliveryProgress}%</span>
          </div>
          <div className="w-full h-2 bg-festival-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.productId}
                className="p-4 sm:p-5 rounded-2xl bg-festival-card border border-festival-border flex flex-col sm:flex-row items-center gap-4 justify-between"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=200'}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover border border-amber-500/20 flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <p className="text-xs text-amber-400 font-medium">{item.packSize}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-black text-white">{formatCurrency(item.price)}</span>
                      {item.originalPrice > item.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-festival-border">
                  {/* Quantity */}
                  <div className="flex items-center border border-festival-border rounded-xl bg-festival-dark">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-white min-w-[28px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping More Crackers</span>
            </Link>
          </div>

          {/* Order Summary Card */}
          <div className="bg-festival-card border border-festival-border p-6 rounded-3xl h-fit space-y-6">
            <h3 className="text-base font-bold text-white pb-3 border-b border-festival-border">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal:</span>
                <span className="font-bold text-white">{formatCurrency(cartSubtotal)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Direct Factory Savings:</span>
                  <span>-{formatCurrency(totalSavings)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span>Estimated Shipping:</span>
                <span>{cartSubtotal >= FREE_DELIVERY_THRESHOLD ? 'FREE' : 'Calculated at checkout'}</span>
              </div>
              <div className="pt-3 border-t border-festival-border flex justify-between text-base font-black text-white">
                <span>Total Amount:</span>
                <span className="text-amber-400 text-lg">{formatCurrency(cartSubtotal)}</span>
              </div>
            </div>

            {/* Min order check */}
            {!isMinOrderMet && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs leading-relaxed">
                ⚠️ Minimum order amount is <strong>{formatCurrency(MIN_ORDER_AMOUNT)}</strong>. Please add {formatCurrency(MIN_ORDER_AMOUNT - cartSubtotal)} more to checkout.
              </div>
            )}

            <button
              disabled={!isMinOrderMet}
              onClick={() => navigate('/checkout')}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to COD Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="p-3 rounded-xl bg-festival-dark/80 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Strictly Cash On Delivery (COD). No advance payment needed!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
