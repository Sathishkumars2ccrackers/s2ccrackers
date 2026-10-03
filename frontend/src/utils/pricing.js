/**
 * Unified Pricing Calculation Utility (Frontend)
 * S2C Crackers - Sivakasi Factory Direct Fireworks
 *
 * Ensures consistent calculation and formatting of MRP, Selling Price,
 * Discount Percentage, Discount Savings, Order MRP Totals, and Order Savings
 * across Cart, Checkout, Product Cards, Detail Pages, Invoices, Tracking, and Admin.
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
 * Calculate pricing breakdown for a single product or cart item
 * @param {Object} item Product or order item
 * @param {number} quantity Quantity
 * @returns {Object} Full item pricing breakdown
 */
export const calculateItemPricing = (item = {}, quantity = 1) => {
  const safeItem = item && typeof item === 'object' ? item : {};
  const rawQty = parseInt(quantity, 10);
  const qty = isNaN(rawQty) || rawQty < 1 ? 1 : rawQty;

  // Selling price (current offer price / factory direct rate)
  let sellingPrice = 0;
  if (typeof safeItem.sellingPrice === 'number' && !isNaN(safeItem.sellingPrice)) {
    sellingPrice = Math.max(0, safeItem.sellingPrice);
  } else if (typeof safeItem.price === 'number' && !isNaN(safeItem.price)) {
    sellingPrice = Math.max(0, safeItem.price);
  } else {
    const parsed = parseFloat(safeItem.sellingPrice || safeItem.price || 0);
    sellingPrice = isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  // MRP (Original factory catalog price)
  let mrpPrice = sellingPrice;
  const rawMrp = safeItem.mrpPrice !== undefined
    ? safeItem.mrpPrice
    : (safeItem.originalPrice !== undefined ? safeItem.originalPrice : sellingPrice);

  if (typeof rawMrp === 'number' && !isNaN(rawMrp)) {
    mrpPrice = Math.max(sellingPrice, rawMrp);
  } else {
    const parsedMrp = parseFloat(rawMrp);
    mrpPrice = isNaN(parsedMrp) ? sellingPrice : Math.max(sellingPrice, parsedMrp);
  }

  // Unit discount calculations
  const discountAmount = Math.max(0, Math.round((mrpPrice - sellingPrice) * 100) / 100);
  const discountPercent = mrpPrice > 0
    ? Math.max(0, Math.min(100, Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)))
    : 0;

  // Line totals for given quantity
  const lineMrp = Math.round(mrpPrice * qty * 100) / 100;
  const lineSellingPrice = Math.round(sellingPrice * qty * 100) / 100;
  const lineSavings = Math.round(discountAmount * qty * 100) / 100;

  return {
    productId: (safeItem.productId || safeItem._id || safeItem.id || '').toString(),
    productCode: (safeItem.productCode || safeItem.code || '').toString().trim(),
    name: (safeItem.name || 'Sivakasi Fireworks Item').toString().trim(),
    quantity: qty,
    mrpPrice,
    sellingPrice,
    discountPercent,
    discountAmount,
    lineMrp,
    lineSellingPrice,
    lineSubtotal: lineSellingPrice,
    lineSavings,
  };
};

/**
 * Calculate unified pricing totals for an entire order or cart
 * @param {Array} items Array of products or cart/order items
 * @param {Object} options Options (deliveryFee, discountSlabs, discountPercentage, discountAmount, specialDiscount, freeDeliveryThreshold, etc.)
 * @returns {Object} Complete unified order pricing breakdown
 */
export const calculateOrderPricing = (items = [], options = {}) => {
  const safeOptions = options && typeof options === 'object' ? options : {};
  const {
    discountSlabs = [],
    freeDeliveryThreshold = 3000,
    defaultDeliveryFee = 150,
  } = safeOptions;

  let totalMRP = 0;
  let factorySubtotal = 0;
  let itemSavingsTotal = 0;

  const validItemsArray = Array.isArray(items) ? items : [];

  const processedItems = validItemsArray.map((item) => {
    const itemPricing = calculateItemPricing(item, item?.quantity || 1);
    totalMRP += itemPricing.lineMrp;
    factorySubtotal += itemPricing.lineSellingPrice;
    itemSavingsTotal += itemPricing.lineSavings;
    return {
      ...(item && typeof item === 'object' ? item : {}),
      ...itemPricing,
    };
  });

  totalMRP = Math.round(totalMRP * 100) / 100;
  factorySubtotal = Math.round(factorySubtotal * 100) / 100;
  itemSavingsTotal = Math.round(itemSavingsTotal * 100) / 100;

  // Step 2 & 3: Total Product Discount Saved & Amount to be Paid After Product Discount
  const totalProductDiscount = Math.max(0, Math.round((totalMRP - factorySubtotal) * 100) / 100);
  const amountAfterProductDiscount = factorySubtotal; // Exactly equals Factory Price Subtotal

  // Step 4: Special Discount (Order-level / Slab Discount)
  let specialDiscountPercentage = 0;
  let specialDiscount = 0;

  if (typeof safeOptions.specialDiscount === 'number' && !isNaN(safeOptions.specialDiscount)) {
    specialDiscount = Math.max(0, safeOptions.specialDiscount);
    specialDiscountPercentage = Number(safeOptions.specialDiscountPercentage || safeOptions.discountPercentage || 0);
  } else if (typeof safeOptions.discountAmount === 'number' && !isNaN(safeOptions.discountAmount)) {
    specialDiscount = Math.max(0, safeOptions.discountAmount);
    specialDiscountPercentage = Number(safeOptions.discountPercentage || 0);
  } else if (Array.isArray(discountSlabs) && discountSlabs.length > 0 && amountAfterProductDiscount > 0) {
    const matchingSlabs = discountSlabs.filter(
      (s) => s && typeof s.minAmount === 'number' && amountAfterProductDiscount >= s.minAmount && (s.discountPercentage || 0) > 0
    );
    if (matchingSlabs.length > 0) {
      matchingSlabs.sort(
        (a, b) => (b.minAmount || 0) - (a.minAmount || 0) || (b.discountPercentage || 0) - (a.discountPercentage || 0)
      );
      specialDiscountPercentage = matchingSlabs[0].discountPercentage || 0;
      specialDiscount = Math.round((amountAfterProductDiscount * specialDiscountPercentage) / 100);
    }
  } else if (typeof safeOptions.discountPercentage === 'number' && safeOptions.discountPercentage > 0) {
    specialDiscountPercentage = safeOptions.discountPercentage;
    specialDiscount = Math.round((amountAfterProductDiscount * specialDiscountPercentage) / 100);
  }

  // Step 5: Delivery Charges calculation
  let deliveryCharges = 0;
  if (typeof safeOptions.deliveryCharges === 'number' && !isNaN(safeOptions.deliveryCharges)) {
    deliveryCharges = Math.max(0, safeOptions.deliveryCharges);
  } else if (typeof safeOptions.deliveryFee === 'number' && !isNaN(safeOptions.deliveryFee)) {
    deliveryCharges = Math.max(0, safeOptions.deliveryFee);
  } else {
    deliveryCharges = amountAfterProductDiscount >= (Number(freeDeliveryThreshold) || 3000)
      ? 0
      : (Number(defaultDeliveryFee) || 150);
  }

  // Step 6: Final Payable Amount
  const finalPayableAmount = Math.max(
    0,
    Math.round((amountAfterProductDiscount - specialDiscount + deliveryCharges) * 100) / 100
  );

  // Total Savings across items + special slab discount
  const totalSavings = Math.round((totalProductDiscount + specialDiscount) * 100) / 100;

  return {
    // Primary Unified Pricing Structure
    totalMRP,
    totalProductDiscount,
    productDiscountSaved: totalProductDiscount,
    amountAfterProductDiscount,
    specialDiscount,
    specialDiscountPercentage,
    deliveryCharges,
    finalPayableAmount,
    totalSavings,

    // Backward compatibility aliases
    items: processedItems,
    orderMrpTotal: totalMRP,
    orderItemsSubtotal: factorySubtotal,
    subtotal: factorySubtotal,
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
export const calculateOrderTotals = calculateOrderPricing;

/**
 * Safely parse and recalculate unified order totals from any stored Order object
 * @param {Object} order Stored or fetched order object
 * @returns {Object} Complete unified order pricing breakdown
 */
export const calculateOrderTotalsFromOrder = (order = {}) => {
  if (!order || typeof order !== 'object') {
    return calculateOrderTotals([]);
  }

  const items = Array.isArray(order.items) ? order.items : [];

  // Calculate MRP Total
  let totalMRP = 0;
  if (typeof order.orderMrpTotal === 'number' && order.orderMrpTotal > 0) {
    totalMRP = order.orderMrpTotal;
  } else if (items.length > 0) {
    totalMRP = items.reduce((sum, item) => {
      const mrp = item.mrpPrice !== undefined
        ? item.mrpPrice
        : (item.originalPrice !== undefined ? item.originalPrice : (item.sellingPrice || item.price || 0));
      return sum + (Number(mrp) || 0) * (Number(item.quantity) || 1);
    }, 0);
  }

  // Calculate Amount After Product Discount (Factory Price Subtotal)
  let amountAfterProductDiscount = 0;
  if (typeof order.orderItemsSubtotal === 'number' && order.orderItemsSubtotal > 0) {
    amountAfterProductDiscount = order.orderItemsSubtotal;
  } else if (typeof order.subtotal === 'number' && order.subtotal > 0) {
    amountAfterProductDiscount = order.subtotal;
  } else if (items.length > 0) {
    amountAfterProductDiscount = items.reduce((sum, item) => {
      const rate = item.sellingPrice !== undefined ? item.sellingPrice : (item.price || 0);
      return sum + (Number(rate) || 0) * (Number(item.quantity) || 1);
    }, 0);
  } else if (typeof order.totalAmount === 'number' && order.totalAmount > 0) {
    amountAfterProductDiscount = order.totalAmount - (order.deliveryFee || 0) + (order.discountAmount || 0);
  }

  totalMRP = Math.round(totalMRP * 100) / 100;
  amountAfterProductDiscount = Math.round(amountAfterProductDiscount * 100) / 100;

  if (totalMRP < amountAfterProductDiscount) {
    totalMRP = amountAfterProductDiscount;
  }

  // Total Product Discount Saved
  const totalProductDiscount = Math.max(0, Math.round((totalMRP - amountAfterProductDiscount) * 100) / 100);

  // Special Discount
  const specialDiscount = Number(order.discountAmount || order.specialDiscount || 0);
  const specialDiscountPercentage = Number(order.discountPercentage || order.specialDiscountPercentage || 0);

  // Delivery Charges
  const deliveryCharges = Number(
    order.deliveryCharges !== undefined
      ? order.deliveryCharges
      : (order.deliveryFee !== undefined ? order.deliveryFee : 0)
  );

  // Final Payable Amount
  let finalPayableAmount = 0;
  if (typeof order.orderFinalTotal === 'number' && order.orderFinalTotal >= 0) {
    finalPayableAmount = order.orderFinalTotal;
  } else if (typeof order.totalAmount === 'number' && order.totalAmount >= 0) {
    finalPayableAmount = order.totalAmount;
  } else {
    finalPayableAmount = Math.max(0, amountAfterProductDiscount - specialDiscount + deliveryCharges);
  }
  finalPayableAmount = Math.round(finalPayableAmount * 100) / 100;

  // Total Savings
  const totalSavings = Math.round((totalProductDiscount + specialDiscount) * 100) / 100;

  return {
    totalMRP,
    totalProductDiscount,
    productDiscountSaved: totalProductDiscount,
    amountAfterProductDiscount,
    specialDiscount,
    specialDiscountPercentage,
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

export default {
  calculateItemPricing,
  calculateOrderPricing,
  calculateOrderTotals,
  calculateOrderTotalsFromOrder,
};
