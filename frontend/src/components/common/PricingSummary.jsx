import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { calculateOrderTotals, calculateOrderTotalsFromOrder } from '../../utils/pricing';

/**
 * Unified Pricing Summary Breakdown Component
 * S2C Crackers - Sivakasi Factory Direct Fireworks
 *
 * Enforces the exact required pricing calculation sequence and display format
 * across Cart, CartDrawer, Checkout, OrderSuccess, OrderTracking, Invoice, and Admin.
 *
 * Sequence:
 * 1. Total MRP Value:                         ₹XX,XXX
 * 2. Product Discount Saved:                - ₹XX,XXX
 * 3. Amount to be Paid After Discount:        ₹X,XXX
 * 4. Special Discount:                       - ₹XXX / ₹0
 * 5. Delivery Charges:                       ₹XXX / FREE
 * --------------------------------------------
 * 6. FINAL PAYABLE AMOUNT:                   ₹X,XXX
 * --------------------------------------------
 * 7. TOTAL SAVINGS:                          ₹XX,XXX
 */
const PricingSummary = ({
  totals,
  order,
  variant = 'dark', // 'dark' | 'light' | 'invoice' | 'admin'
  title,
  showProminentSavings = true,
  className = '',
  amountLabel = 'Amount to be Paid After Discount',
  hideFinalTotal = false,
}) => {
  // Resolve totals using unified calculation utility
  const resolvedTotals = React.useMemo(() => {
    if (totals && typeof totals === 'object') {
      const totalMRP = Number(totals.totalMRP ?? totals.orderMrpTotal ?? 0);
      const amountAfterProductDiscount = Number(totals.amountAfterProductDiscount ?? totals.orderItemsSubtotal ?? totals.subtotal ?? 0);
      const totalProductDiscount = Number(totals.totalProductDiscount ?? totals.productDiscountSaved ?? totals.orderItemSavingsTotal ?? Math.max(0, totalMRP - amountAfterProductDiscount));
      const specialDiscount = Number(totals.specialDiscount ?? totals.discountAmount ?? 0);
      const specialDiscountPercentage = Number(totals.specialDiscountPercentage ?? totals.discountPercentage ?? 0);
      const deliveryCharges = Number(totals.deliveryCharges ?? totals.deliveryFee ?? 0);
      const finalPayableAmount = Number(totals.finalPayableAmount ?? totals.orderFinalTotal ?? totals.totalAmount ?? Math.max(0, amountAfterProductDiscount - specialDiscount + deliveryCharges));
      const totalSavings = Number(totals.totalSavings ?? totals.orderSavingsTotal ?? (totalProductDiscount + specialDiscount));

      return {
        totalMRP,
        totalProductDiscount,
        amountAfterProductDiscount,
        specialDiscount,
        specialDiscountPercentage,
        deliveryCharges,
        finalPayableAmount,
        totalSavings,
      };
    }

    if (order && typeof order === 'object') {
      return calculateOrderTotalsFromOrder(order);
    }

    return calculateOrderTotals([]);
  }, [totals, order]);

  const {
    totalMRP,
    totalProductDiscount,
    amountAfterProductDiscount,
    specialDiscount,
    specialDiscountPercentage,
    deliveryCharges,
    finalPayableAmount,
    totalSavings,
  } = resolvedTotals;

  const isLight = variant === 'light' || variant === 'invoice';

  if (isLight) {
    return (
      <div className={`pricing-breakdown-root space-y-2.5 text-xs text-slate-800 ${className}`}>
        {title && (
          <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs pb-1 border-b border-slate-200">
            {title}
          </h4>
        )}

        {/* Prominent Savings Section for Invoice / Light */}
        {showProminentSavings && totalSavings > 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-xl p-3 sm:p-4 text-emerald-950 space-y-1 mb-3">
            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-500 flex-shrink-0" />
              <span>TOTAL SAVINGS: {formatCurrency(totalSavings)}</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 font-medium">
              Direct factory-discounted Sivakasi fireworks rates applied!
            </p>
          </div>
        )}

        {/* 1. Total MRP Value */}
        <div className="flex justify-between items-start gap-2 text-slate-600">
          <span className="font-medium min-w-0 flex-1 break-words">Total MRP Value:</span>
          <span className="font-mono font-bold text-slate-500 line-through flex-shrink-0 text-right">
            {formatCurrency(totalMRP)}
          </span>
        </div>

        {/* 2. Product Discount Saved */}
        <div className="flex justify-between items-start gap-2 text-emerald-700 font-semibold">
          <span className="min-w-0 flex-1 break-words">Product Discount Saved:</span>
          <span className="font-mono font-bold text-emerald-800 flex-shrink-0 text-right">
            - {formatCurrency(totalProductDiscount)}
          </span>
        </div>

        {/* 3. Amount to be Paid After Discount (Factory Price Subtotal) */}
        <div className="flex justify-between items-start gap-2 text-slate-900 font-bold bg-slate-100/80 px-2 py-1.5 rounded-lg border border-slate-200">
          <span className="min-w-0 flex-1 break-words">{amountLabel}:</span>
          <span className="font-mono font-black text-slate-900 flex-shrink-0 text-right">
            {formatCurrency(amountAfterProductDiscount)}
          </span>
        </div>

        {/* 4. Special Discount */}
        <div className="flex justify-between items-start gap-2 text-slate-700">
          <span className="min-w-0 flex-1 break-words">
            Special Discount{specialDiscountPercentage > 0 ? ` (${specialDiscountPercentage}%)` : ''}:
          </span>
          <span className={`font-mono font-bold flex-shrink-0 text-right ${specialDiscount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
            {specialDiscount > 0 ? `- ${formatCurrency(specialDiscount)}` : '₹0'}
          </span>
        </div>

        {/* 5. Delivery Charges */}
        <div className="flex justify-between items-start gap-2 text-slate-600">
          <span className="font-medium min-w-0 flex-1 break-words">Delivery Charges:</span>
          <span className="font-mono font-bold flex-shrink-0 text-right">
            {deliveryCharges === 0 ? (
              <span className="text-emerald-700 font-black uppercase text-[11px]">FREE</span>
            ) : (
              formatCurrency(deliveryCharges)
            )}
          </span>
        </div>

        {/* 6. Final Payable Amount */}
        {!hideFinalTotal && (
          <div className="pt-2.5 mt-2 border-t-2 border-slate-300 flex justify-between items-center gap-2 flex-wrap text-slate-950">
            <span className="text-xs sm:text-sm font-black uppercase min-w-0 flex-1 break-words">
              FINAL PAYABLE AMOUNT:
            </span>
            <span className="text-base sm:text-xl font-black text-amber-600 font-mono flex-shrink-0 text-right">
              {formatCurrency(finalPayableAmount)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Festival Dark Theme (Customer Pages & Admin Modal)
  return (
    <div className={`pricing-breakdown-root space-y-2.5 text-xs text-slate-300 ${className}`}>
      {title && (
        <h4 className="font-bold text-white uppercase tracking-wide text-xs pb-1.5 border-b border-festival-border flex items-center justify-between">
          <span>{title}</span>
        </h4>
      )}

      {/* 1. Total MRP Value */}
      <div className="flex justify-between items-start gap-2">
        <span className="font-medium text-slate-300 min-w-0 flex-1 break-words">Total MRP Value:</span>
        <span className="font-semibold text-slate-400 line-through font-mono flex-shrink-0 text-right">
          {formatCurrency(totalMRP)}
        </span>
      </div>

      {/* 2. Product Discount Saved */}
      <div className="flex justify-between items-start gap-2 text-emerald-400 font-bold">
        <span className="min-w-0 flex-1 break-words">Product Discount Saved:</span>
        <span className="font-mono flex-shrink-0 text-right">
          - {formatCurrency(totalProductDiscount)}
        </span>
      </div>

      {/* 3. Amount to be Paid After Discount */}
      <div className="flex justify-between items-start gap-2 text-slate-100 font-bold bg-festival-dark/80 px-2.5 py-1.5 rounded-xl border border-festival-border">
        <span className="min-w-0 flex-1 break-words">{amountLabel}:</span>
        <span className="font-mono font-black text-white flex-shrink-0 text-right">
          {formatCurrency(amountAfterProductDiscount)}
        </span>
      </div>

      {/* 4. Special Discount */}
      <div className="flex justify-between items-start gap-2">
        <span className="text-slate-300 min-w-0 flex-1 break-words flex items-center gap-1">
          {specialDiscount > 0 && <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
          <span>Special Discount{specialDiscountPercentage > 0 ? ` (${specialDiscountPercentage}%)` : ''}:</span>
        </span>
        <span className={`font-mono font-bold flex-shrink-0 text-right ${specialDiscount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
          {specialDiscount > 0 ? `- ${formatCurrency(specialDiscount)}` : '₹0'}
        </span>
      </div>

      {/* 5. Delivery Charges */}
      <div className="flex justify-between items-start gap-2 text-slate-300">
        <span className="min-w-0 flex-1 break-words">Delivery Charges:</span>
        <span className="font-semibold text-white flex-shrink-0 text-right">
          {deliveryCharges === 0 ? (
            <span className="text-emerald-400 font-black uppercase">FREE</span>
          ) : (
            formatCurrency(deliveryCharges)
          )}
        </span>
      </div>

      {/* Prominent Savings Banner (Product + Special Discount) */}
      {showProminentSavings && totalSavings > 0 && (
        <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-950/90 to-festival-card border-2 border-emerald-500/50 text-center space-y-1 shadow-md my-3">
          <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-black text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 fill-emerald-400 text-emerald-400 flex-shrink-0" />
            <span>TOTAL SAVINGS: {formatCurrency(totalSavings)}</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-200/80">
            Direct Sivakasi factory discounts applied!
          </p>
        </div>
      )}

      {/* 6. Final Payable Amount */}
      {!hideFinalTotal && (
        <div className="pt-3 border-t border-festival-border flex items-center justify-between gap-2 flex-wrap text-sm sm:text-base font-black text-white">
          <span className="text-amber-400 min-w-0 flex-1 break-words uppercase">
            FINAL PAYABLE AMOUNT:
          </span>
          <span className="text-amber-400 text-lg sm:text-xl font-mono flex-shrink-0 text-right">
            {formatCurrency(finalPayableAmount)}
          </span>
        </div>
      )}
    </div>
  );
};

export default PricingSummary;
