/**
 * Unified Pricing Calculation Utility (Backend)
 * S2C Crackers - Sivakasi Factory Direct Fireworks
 *
 * Ensures consistent calculation of MRP, Selling Price, Discount Percentage,
 * Discount Amount, Line Savings, Order MRP Totals, and Order Savings across
 * database, orders, invoices, tracking, admin, and analytics.
 */

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

  // Selling price (current discounted offer price)
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

  // Discount calculations per single unit
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
    name: (safeItem.name || 'Cracker Item').toString().trim(),
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
 * Calculate pricing for an entire order or cart
 * @param {Array} items Array of products or cart/order items
 * @param {Object} options Configuration options (deliveryFee, discountSlabs, etc.)
 * @returns {Object} Complete order pricing breakdown
 */
const calculateOrderPricing = (items = [], options = {}) => {
  const safeOptions = options && typeof options === 'object' ? options : {};
  const {
    discountSlabs = [],
    freeDeliveryThreshold = 3000,
    defaultDeliveryFee = 150,
  } = safeOptions;

  let orderMrpTotal = 0;
  let orderItemsSubtotal = 0;
  let orderItemSavingsTotal = 0;

  const validItemsArray = Array.isArray(items) ? items : [];

  const processedItems = validItemsArray.map((item) => {
    const itemPricing = calculateItemPricing(item, item?.quantity || 1);
    orderMrpTotal += itemPricing.lineMrp;
    orderItemsSubtotal += itemPricing.lineSellingPrice;
    orderItemSavingsTotal += itemPricing.lineSavings;
    return {
      ...(item && typeof item === 'object' ? item : {}),
      ...itemPricing,
    };
  });

  orderMrpTotal = Math.round(orderMrpTotal * 100) / 100;
  orderItemsSubtotal = Math.round(orderItemsSubtotal * 100) / 100;
  orderItemSavingsTotal = Math.round(orderItemSavingsTotal * 100) / 100;

  // Order-level Tiered Discount Slab Calculation
  let slabDiscountPercentage = 0;
  let slabDiscountAmount = 0;

  if (Array.isArray(discountSlabs) && discountSlabs.length > 0 && orderItemsSubtotal > 0) {
    const matchingSlabs = discountSlabs.filter(
      (s) => s && typeof s.minAmount === 'number' && orderItemsSubtotal >= s.minAmount && (s.discountPercentage || 0) > 0
    );
    if (matchingSlabs.length > 0) {
      matchingSlabs.sort(
        (a, b) => (b.minAmount || 0) - (a.minAmount || 0) || (b.discountPercentage || 0) - (a.discountPercentage || 0)
      );
      slabDiscountPercentage = matchingSlabs[0].discountPercentage || 0;
      slabDiscountAmount = Math.round((orderItemsSubtotal * slabDiscountPercentage) / 100);
    }
  }

  // Final Shipping / Delivery Fee calculation
  let calculatedDeliveryFee = 0;
  if (typeof safeOptions.deliveryFee === 'number' && !isNaN(safeOptions.deliveryFee)) {
    calculatedDeliveryFee = Math.max(0, safeOptions.deliveryFee);
  } else {
    calculatedDeliveryFee = orderItemsSubtotal >= (Number(freeDeliveryThreshold) || 3000) ? 0 : (Number(defaultDeliveryFee) || 150);
  }

  // Total Savings achieved by customer across all item discounts + order slab discounts
  const orderSavingsTotal = Math.round((orderItemSavingsTotal + slabDiscountAmount) * 100) / 100;

  // Final Payable Grand Total
  const orderFinalTotal = Math.max(
    0,
    Math.round((orderItemsSubtotal - slabDiscountAmount + calculatedDeliveryFee) * 100) / 100
  );

  return {
    items: processedItems,
    orderMrpTotal,
    orderItemsSubtotal,
    subtotal: orderItemsSubtotal, // backward compatibility
    orderItemSavingsTotal,
    slabDiscountPercentage,
    slabDiscountAmount,
    discountPercentage: slabDiscountPercentage, // backward compatibility
    discountAmount: slabDiscountAmount, // backward compatibility
    orderSavingsTotal,
    deliveryFee: calculatedDeliveryFee,
    orderFinalTotal,
    totalAmount: orderFinalTotal, // backward compatibility
  };
};

module.exports = {
  calculateItemPricing,
  calculateOrderPricing,
};
