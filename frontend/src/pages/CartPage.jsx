import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, Sparkles, ArrowLeft, Percent, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, formatProductCode } from '../utils/formatters';
import { calculateItemPricing } from '../utils/pricing';
import ProductImage from '../components/common/ProductImage';
import PricingSummary from '../components/common/PricingSummary';
import SEO from '../components/common/SEO';

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartSubtotal,
    totalMrp,
    totalSavings,
    totalItemsCount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const {
    minimumOrderAmount,
    deliveryMessage,
    calculateDiscount,
    getFreeDeliveryProgress,
  } = useSettings();

  const isMinOrderMet = cartSubtotal >= minimumOrderAmount;
  const { progressPercent: freeDeliveryProgress, amountNeeded: amountNeededForFreeDelivery, isUnlocked: isFreeDeliveryUnlocked } =
    getFreeDeliveryProgress(cartSubtotal);

  const { discountPercentage, discountAmount, nextSlab, amountNeededForNextSlab } = calculateDiscount(cartSubtotal);
  const finalCartTotal = Math.max(0, cartSubtotal - discountAmount);
  const totalCombinedSavings = totalSavings + discountAmount;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-festival-dark px-4 text-center space-y-4">
        <SEO
          title="Your Shopping Cart | S2C Crackers Sivakasi"
          description="Your festival shopping cart is currently empty. Explore authentic Sivakasi fireworks, sparklers, flower pots, and deluxe gift box combos at factory direct price."
          canonical="https://www.s2ccrackers.com/cart"
        />
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
    <div className="min-h-screen bg-festival-dark py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <SEO
        title="Your Shopping Cart | S2C Crackers Sivakasi"
        description="Review your selected Sivakasi fireworks and crackers in cart. Unlock festive discount slabs and free door delivery before direct factory checkout."
        canonical="https://www.s2ccrackers.com/cart"
      />
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 border-b border-festival-border gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2 sm:gap-3">
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 flex-shrink-0" />
              <span>Shopping Cart ({totalItemsCount} items)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Review your Sivakasi crackers and complete factory discount savings.</p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 cursor-pointer self-end sm:self-auto py-1 px-2 rounded-lg bg-rose-950/40 sm:bg-transparent border sm:border-0 border-rose-500/20"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-200 flex-wrap gap-1">
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
            <span className="font-mono">{freeDeliveryProgress}%</span>
          </div>
          <div className="w-full h-2 bg-festival-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        {/* Discount Slab Incentive Banner */}
        {nextSlab && amountNeededForNextSlab > 0 && (
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-purple-200 font-medium min-w-0">
              <Percent className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="break-words">
                Add <strong className="text-purple-300">{formatCurrency(amountNeededForNextSlab)}</strong> more to unlock an extra <strong className="text-amber-300 font-mono">{nextSlab.discountPercentage}% Special Discount</strong>!
              </span>
            </div>
            <Link
              to="/products"
              className="text-[11px] font-bold text-purple-300 hover:text-white underline flex-shrink-0"
            >
              Add More Crackers →
            </Link>
          </div>
        )}

        {/* Cart Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-3.5 sm:space-y-4">
            {cartItems.map((item) => {
              const itemPricing = calculateItemPricing(item, item.quantity);
              return (
                <div
                  key={item.productId}
                  className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-festival-card border border-festival-border flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 justify-between min-w-0"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0 flex-1">
                    <ProductImage
                      product={item}
                      src={item.image}
                      alt={item.name}
                      optimizedWidth={200}
                      optimizedHeight={200}
                      componentName="CartPage"
                      enableZoom={true}
                      containerClassName="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-amber-500/20 flex-shrink-0"
                      className="w-full h-full object-cover"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-white break-words">{item.name}</h3>
                        {item.productCode && (
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 bg-slate-950 border border-amber-500/30 px-1.5 py-0.5 rounded flex-shrink-0">
                            {formatProductCode(item.productCode)}
                          </span>
                        )}
                      </div>

                      {/* Line Item Pricing Breakdown */}
                      <div className="text-[11px] sm:text-xs space-y-0.5 pt-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-400">
                          <span>MRP:</span>
                          <span className="line-through">{formatCurrency(itemPricing.mrpPrice)} × {item.quantity} = {formatCurrency(itemPricing.lineMrp)}</span>
                          {itemPricing.discountPercent > 0 && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              {itemPricing.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-amber-300 font-semibold">
                          <span>Our Price:</span>
                          <span>{formatCurrency(itemPricing.sellingPrice)} × {item.quantity} = <strong>{formatCurrency(itemPricing.lineSellingPrice)}</strong></span>
                        </div>
                        {itemPricing.lineSavings > 0 && (
                          <div className="text-[10px] sm:text-[11px] font-bold text-emerald-400">
                            You Save: {formatCurrency(itemPricing.lineSavings)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-festival-border">
                    {/* Quantity */}
                    <div className="flex items-center border border-festival-border rounded-xl bg-festival-dark p-0.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 sm:px-3 text-xs font-bold text-white min-w-[24px] sm:min-w-[28px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[65px] sm:min-w-[80px]">
                      <span className="text-xs sm:text-sm font-black text-amber-400 block font-mono">
                        {formatCurrency(itemPricing.lineSellingPrice)}
                      </span>
                      {itemPricing.lineSavings > 0 && (
                        <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold block">
                          Save {formatCurrency(itemPricing.lineSavings)}
                        </span>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping More Crackers</span>
            </Link>
          </div>

            {/* Order Summary Card */}
            <div className="bg-festival-card border border-festival-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl h-fit space-y-4 sm:space-y-6">
              <h3 className="text-sm sm:text-base font-bold text-white pb-3 border-b border-festival-border">
                Order Summary
              </h3>

              <PricingSummary
                totals={{
                  totalMRP: totalMrp,
                  amountAfterProductDiscount: cartSubtotal,
                  totalProductDiscount: totalSavings,
                  specialDiscount: discountAmount,
                  specialDiscountPercentage: discountPercentage,
                  deliveryCharges: isFreeDeliveryUnlocked ? 0 : 150,
                  finalPayableAmount: Math.max(0, cartSubtotal - discountAmount + (isFreeDeliveryUnlocked ? 0 : 150)),
                  totalSavings: totalSavings + discountAmount,
                }}
                amountLabel="Amount to be Paid After Discount"
                showProminentSavings={true}
              />

              {/* Min order check */}
              {!isMinOrderMet && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs leading-relaxed">
                  ⚠️ Minimum order amount is <strong>{formatCurrency(minimumOrderAmount)}</strong>. Please add {formatCurrency(minimumOrderAmount - cartSubtotal)} more to checkout.
                </div>
              )}

              <button
                disabled={!isMinOrderMet}
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 sm:py-4 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-2.5 sm:p-3 rounded-xl bg-festival-dark/80 border border-emerald-500/20 text-[10px] sm:text-[11px] text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{deliveryMessage || 'Door Delivery Available'} • Payment confirmed after order</span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

