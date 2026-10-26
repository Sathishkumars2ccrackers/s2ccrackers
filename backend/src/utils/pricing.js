/**
 * Unified Pricing Calculation Utility (Backend)
 * S2C Crackers - Sivakasi Factory Direct Fireworks
 *
 * Ensures consistent calculation of MRP, Selling Price, Discount Percentage,
 * Discount Amount, Line Savings, Order MRP Totals, and Order Savings across
 * database, orders, invoices, tracking, admin, and analytics.
 *
 * REQUIRED PRICING SEQUENCE:
 * 1. TOTAL MRP VALUE = Sum of (Product MRP × Quantity)
 * 2. TOTAL PRODUCT DISCOUNT SAVED = Total MRP Value - Factory Price Subtotal
 * 3. AMOUNT TO BE PAID AFTER PRODUCT DISCOUNT = Total MRP Value - Total Product Discount Saved (= Factory Price Subtotal)
 * 4. SPECIAL DISCOUNT = Additional order-level / tiered slab discount
 * 5. DELIVERY CHARGES = Shipping fee (or 0 / FREE)
 * 6. FINAL PAYABLE AMOUNT = Amount To Be Paid After Product Discount - Special Discount + Delivery Charges
 * 7. TOTAL SAVINGS = Total Product Discount Saved + Special Discount
 */

/**
 * Monetary Arithmetic Helpers in Integer Paise (1 INR = 100 paise)
 * Guarantees zero IEEE-754 floating-point drift across all multiplications and divisions.
 */
const toPaise = (rupees) => {
  if (rupees === undefined || rupees === null) return 0;
  const num = typeof rupees === 'number' ? rupees : parseFloat(rupees);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round(num * 100);
};

const toRupees = (paise) => {
  if (paise === undefined || paise === null) return 0;
  const num = typeof paise === 'number' ? paise : parseInt(paise, 10);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round(num) / 100;
};

/**
 * Calculate pricing for a single item / product
 * @param {Object} item Product or order item object
 * @param {number} quantity Requested quantity
 * @returns {Object} Complete item pricing breakdown
 */
const calculateItemPricing = (item = {}, quantity = 1) => {
  const safeItem = item && typeof item === 'object' ? item : {};
  const rawQty = parseInt(quantity, 10);
  const qty = isNaN(rawQty) || rawQty < 1 ? 1 : rawQty;

  // Selling price (current discounted offer price / factory rate)
  let sellingPricePaise = 0;
  if (typeof safeItem.sellingPrice === 'number' && !isNaN(safeItem.sellingPrice)) {
    sellingPricePaise = Math.max(0, toPaise(safeItem.sellingPrice));
  } else if (typeof safeItem.price === 'number' && !isNaN(safeItem.price)) {
    sellingPricePaise = Math.max(0, toPaise(safeItem.price));
  } else {
    sellingPricePaise = Math.max(0, toPaise(safeItem.sellingPrice || safeItem.price || 0));
  }

  // MRP (Original factory catalog price)
  let mrpPricePaise = sellingPricePaise;
  const rawMrp = safeItem.mrpPrice !== undefined
    ? safeItem.mrpPrice
    : (safeItem.originalPrice !== undefined ? safeItem.originalPrice : undefined);

  if (rawMrp !== undefined) {
    const parsedMrpPaise = toPaise(rawMrp);
    mrpPricePaise = Math.max(sellingPricePaise, parsedMrpPaise);
  }

  // Discount calculations per single unit
  const discountAmountPaise = Math.max(0, mrpPricePaise - sellingPricePaise);
  const discountPercent = mrpPricePaise > 0
    ? Math.max(0, Math.min(100, Math.round(((mrpPricePaise - sellingPricePaise) / mrpPricePaise) * 100)))
    : 0;

  // Line totals for given quantity (in integer paise)
  const lineMrpPaise = mrpPricePaise * qty;
  const lineSellingPricePaise = sellingPricePaise * qty;
  const lineSavingsPaise = discountAmountPaise * qty;

  return {
    productId: (safeItem.productId || safeItem._id || safeItem.id || '').toString(),
    productCode: (safeItem.productCode || safeItem.code || '').toString().trim(),
    name: (safeItem.name || 'Cracker Item').toString().trim(),
    quantity: qty,
    mrpPrice: toRupees(mrpPricePaise),
    sellingPrice: toRupees(sellingPricePaise),
    discountPercent,
    discountAmount: toRupees(discountAmountPaise),
    lineMrp: toRupees(lineMrpPaise),
    lineSellingPrice: toRupees(lineSellingPricePaise),
    lineSubtotal: toRupees(lineSellingPricePaise),
    lineSavings: toRupees(lineSavingsPaise),
  };
};

/**
 * Calculate unified pricing totals for an entire order or cart
 * @param {Array} items Array of products or cart/order items
 * @param {Object} options Configuration options (deliveryFee, discountSlabs, discountPercentage, discountAmount, specialDiscount, etc.)
 * @returns {Object} Complete unified order pricing breakdown
 */
const calculateOrderPricing = (items = [], options = {}) => {
  const safeOptions = options && typeof options === 'object' ? options : {};
  const {
    discountSlabs = [],
    freeDeliveryThreshold = 7000,
    defaultDeliveryFee = 300,
  } = safeOptions;

  let totalMrpPaise = 0;
  let factorySubtotalPaise = 0;
  let itemSavingsTotalPaise = 0;

  const validItemsArray = Array.isArray(items) ? items : [];

  const processedItems = validItemsArray.map((item) => {
    const itemPricing = calculateItemPricing(item, item?.quantity || 1);
    totalMrpPaise += toPaise(itemPricing.lineMrp);
    factorySubtotalPaise += toPaise(itemPricing.lineSellingPrice);
    itemSavingsTotalPaise += toPaise(itemPricing.lineSavings);
    return {
      ...(item && typeof item === 'object' ? item : {}),
      ...itemPricing,
    };
  });

  // Step 2 & 3: Total Product Discount Saved & Amount to be Paid After Product Discount
  const totalProductDiscountPaise = Math.max(0, totalMrpPaise - factorySubtotalPaise);
  const amountAfterProductDiscountPaise = factorySubtotalPaise; // Exactly equals Factory Price Subtotal

  // Step 4: Special Discount (Order-level / Slab Discount)
  let specialDiscountPercentage = 0;
  let specialDiscountPaise = 0;

  if (typeof safeOptions.specialDiscount === 'number' && !isNaN(safeOptions.specialDiscount)) {
    specialDiscountPaise = Math.max(0, toPaise(safeOptions.specialDiscount));
    specialDiscountPercentage = Number(safeOptions.specialDiscountPercentage || safeOptions.specialDiscountPercent || safeOptions.discountPercentage || 0);
  } else if (typeof safeOptions.discountAmount === 'number' && !isNaN(safeOptions.discountAmount)) {
    specialDiscountPaise = Math.max(0, toPaise(safeOptions.discountAmount));
    specialDiscountPercentage = Number(safeOptions.discountPercentage || 0);
  } else if (Array.isArray(discountSlabs) && discountSlabs.length > 0 && amountAfterProductDiscountPaise > 0) {
    const matchingSlabs = discountSlabs.filter(
      (s) => s && typeof s.minAmount === 'number' && toPaise(s.minAmount) <= amountAfterProductDiscountPaise && (s.discountPercentage || 0) > 0
    );
    if (matchingSlabs.length > 0) {
      matchingSlabs.sort(
        (a, b) => (b.minAmount || 0) - (a.minAmount || 0) || (b.discountPercentage || 0) - (a.discountPercentage || 0)
      );
      specialDiscountPercentage = matchingSlabs[0].discountPercentage || 0;
      specialDiscountPaise = Math.round((amountAfterProductDiscountPaise * specialDiscountPercentage) / 100);
    }
  } else if (typeof safeOptions.discountPercentage === 'number' && safeOptions.discountPercentage > 0) {
    specialDiscountPercentage = safeOptions.discountPercentage;
    specialDiscountPaise = Math.round((amountAfterProductDiscountPaise * specialDiscountPercentage) / 100);
  }

  // Step 5: Final Shipping / Delivery Fee calculation
  let deliveryChargesPaise = 0;
  if (typeof safeOptions.deliveryCharges === 'number' && !isNaN(safeOptions.deliveryCharges)) {
    deliveryChargesPaise = Math.max(0, toPaise(safeOptions.deliveryCharges));
  } else if (typeof safeOptions.deliveryFee === 'number' && !isNaN(safeOptions.deliveryFee)) {
    deliveryChargesPaise = Math.max(0, toPaise(safeOptions.deliveryFee));
  } else {
    const thresholdPaise = toPaise(freeDeliveryThreshold !== undefined ? freeDeliveryThreshold : 7000);
    const defaultFeePaise = toPaise(defaultDeliveryFee !== undefined ? defaultDeliveryFee : 300);
    deliveryChargesPaise = amountAfterProductDiscountPaise >= thresholdPaise ? 0 : defaultFeePaise;
  }

  // Step 6: Final Payable Grand Total
  const finalPayableAmountPaise = Math.max(
    0,
    amountAfterProductDiscountPaise - specialDiscountPaise + deliveryChargesPaise
  );

  // Total Savings achieved by customer across all item discounts + order slab discounts
  const totalSavingsPaise = totalProductDiscountPaise + specialDiscountPaise;

  const totalMRP = toRupees(totalMrpPaise);
  const totalProductDiscount = toRupees(totalProductDiscountPaise);
  const amountAfterProductDiscount = toRupees(amountAfterProductDiscountPaise);
  const specialDiscount = toRupees(specialDiscountPaise);
  const deliveryCharges = toRupees(deliveryChargesPaise);
  const finalPayableAmount = toRupees(finalPayableAmountPaise);
  const totalSavings = toRupees(totalSavingsPaise);

  return {
    // Primary Unified Pricing Structure
    totalMRP,
    totalProductDiscount,
    productDiscountSaved: totalProductDiscount,
    amountAfterProductDiscount,
    specialDiscount,
    specialDiscountPercentage,
    specialDiscountPercent: specialDiscountPercentage,
    deliveryCharges,
    finalPayableAmount,
    totalSavings,

    // Backward compatibility aliases
    items: processedItems,
    orderMrpTotal: totalMRP,
    orderItemsSubtotal: amountAfterProductDiscount,
    subtotal: amountAfterProductDiscount,
    orderItemSavingsTotal: totalProductDiscount,
    slabDiscountPercentage: specialDiscountPercentage,
    slabDiscountAmount: specialDiscount,
    discountPercentage: specialDiscountPercentage,
    discountAmount: specialDiscount,
    orderSavingsTotal: totalSavings,
    deliveryFee: deliveryCharges,
    orderFinalTotal: finalPayableAmount,
    totalAmount: finalPayableAmount,
  };
};

/**
 * Standard alias for calculateOrderPricing to fulfill calculateOrderTotals API
 */
const calculateOrderTotals = calculateOrderPricing;

/**
 * Safely parse and recalculate unified order totals from any stored Order object
 * @param {Object} order Stored or fetched order object
 * @returns {Object} Complete unified order pricing breakdown
 */
const calculateOrderTotalsFromOrder = (order = {}) => {
  if (!order || typeof order !== 'object') {
    return calculateOrderTotals([]);
  }

  const items = Array.isArray(order.items) ? order.items : [];

  // Calculate MRP Total
  let totalMRP = 0;
  if (typeof order.totalMRP === 'number' && order.totalMRP > 0) {
    totalMRP = order.totalMRP;
  } else if (typeof order.orderMrpTotal === 'number' && order.orderMrpTotal > 0) {
    totalMRP = order.orderMrpTotal;
  } else if (items.length > 0) {
    totalMRP = items.reduce((sum, item) => {
      const mrp = item.mrpPrice !== undefined
        ? item.mrpPrice
        : (item.originalPrice !== undefined ? item.originalPrice : (item.sellingPrice || item.price || 0));
      return sum + toRupees(toPaise(mrp) * (Number(item.quantity) || 1));
    }, 0);
  }

  // Calculate Amount After Product Discount (Factory Price Subtotal)
  let amountAfterProductDiscount = 0;
  if (typeof order.amountAfterProductDiscount === 'number' && order.amountAfterProductDiscount >= 0) {
    amountAfterProductDiscount = order.amountAfterProductDiscount;
  } else if (typeof order.orderItemsSubtotal === 'number' && order.orderItemsSubtotal >= 0) {
    amountAfterProductDiscount = order.orderItemsSubtotal;
  } else if (typeof order.subtotal === 'number' && order.subtotal >= 0) {
    amountAfterProductDiscount = order.subtotal;
  } else if (items.length > 0) {
    amountAfterProductDiscount = items.reduce((sum, item) => {
      const rate = item.sellingPrice !== undefined ? item.sellingPrice : (item.price || 0);
      return sum + toRupees(toPaise(rate) * (Number(item.quantity) || 1));
    }, 0);
  } else if (typeof order.finalPayableAmount === 'number' || typeof order.totalAmount === 'number') {
    const finalAmt = typeof order.finalPayableAmount === 'number' ? order.finalPayableAmount : order.totalAmount;
    amountAfterProductDiscount = finalAmt - (order.deliveryCharges || order.deliveryFee || 0) + (order.specialDiscount || order.discountAmount || 0);
  }

  totalMRP = Math.max(amountAfterProductDiscount, Math.round(totalMRP * 100) / 100);
  amountAfterProductDiscount = Math.round(amountAfterProductDiscount * 100) / 100;

  // Total Product Discount Saved
  let totalProductDiscount = 0;
  if (typeof order.totalProductDiscount === 'number' && order.totalProductDiscount >= 0) {
    totalProductDiscount = order.totalProductDiscount;
  } else if (typeof order.productDiscountSaved === 'number' && order.productDiscountSaved >= 0) {
    totalProductDiscount = order.productDiscountSaved;
  } else if (typeof order.orderItemSavingsTotal === 'number' && order.orderItemSavingsTotal >= 0) {
    totalProductDiscount = order.orderItemSavingsTotal;
  } else {
    totalProductDiscount = Math.max(0, Math.round((totalMRP - amountAfterProductDiscount) * 100) / 100);
  }

  // Special Discount
  const specialDiscount = Number(order.specialDiscount !== undefined ? order.specialDiscount : (order.discountAmount || 0));
  const specialDiscountPercentage = Number(order.specialDiscountPercentage !== undefined ? order.specialDiscountPercentage : (order.specialDiscountPercent || order.discountPercentage || 0));

  // Delivery Charges
  const deliveryCharges = Number(
    order.deliveryCharges !== undefined
      ? order.deliveryCharges
      : (order.deliveryFee !== undefined ? order.deliveryFee : 0)
  );

  // Final Payable Amount
  let finalPayableAmount = 0;
  if (typeof order.finalPayableAmount === 'number' && order.finalPayableAmount >= 0) {
    finalPayableAmount = order.finalPayableAmount;
  } else if (typeof order.orderFinalTotal === 'number' && order.orderFinalTotal >= 0) {
    finalPayableAmount = order.orderFinalTotal;
  } else if (typeof order.totalAmount === 'number' && order.totalAmount >= 0) {
    finalPayableAmount = order.totalAmount;
  } else {
    finalPayableAmount = Math.max(0, amountAfterProductDiscount - specialDiscount + deliveryCharges);
  }
  finalPayableAmount = Math.round(finalPayableAmount * 100) / 100;

  // Total Savings: Product Discount Savings + Special Discount
  const totalSavings = typeof order.totalSavings === 'number' && order.totalSavings >= 0
    ? order.totalSavings
    : Math.round((totalProductDiscount + specialDiscount) * 100) / 100;

  return {
    totalMRP,
    totalProductDiscount,
    productDiscountSaved: totalProductDiscount,
    amountAfterProductDiscount,
    specialDiscount,
    specialDiscountPercentage,
    specialDiscountPercent: specialDiscountPercentage,
    deliveryCharges,
    finalPayableAmount,
    totalSavings,

    // Backward compatibility aliases
    items,
    orderMrpTotal: totalMRP,
    orderItemsSubtotal: amountAfterProductDiscount,
    subtotal: amountAfterProductDiscount,
    orderItemSavingsTotal: totalProductDiscount,
    slabDiscountPercentage: specialDiscountPercentage,
    slabDiscountAmount: specialDiscount,
    discountPercentage: specialDiscountPercentage,
    discountAmount: specialDiscount,
    orderSavingsTotal: totalSavings,
    deliveryFee: deliveryCharges,
    orderFinalTotal: finalPayableAmount,
    totalAmount: finalPayableAmount,
  };
};

module.exports = {
  toPaise,
  toRupees,
  calculateItemPricing,
  calculateOrderPricing,
  calculateOrderTotals,
  calculateOrderTotalsFromOrder,
};
