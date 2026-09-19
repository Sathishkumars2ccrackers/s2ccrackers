/**
 * Unified Pricing Calculation Utility (Frontend)
 * S2C Crackers - Sivakasi Factory Direct Fireworks
 *
 * Ensures consistent calculation and formatting of MRP, Selling Price,
 * Discount Percentage, Discount Savings, Order MRP Totals, and Order Savings
 * across Cart, Checkout, Product Cards, Detail Pages, Invoices, Tracking, and Admin.
 */

/**
 * Calculate pricing breakdown for a single product or cart item
 * @param {Object} item Product or order item
 * @param {number} quantity Quantity
 * @returns {Object} Full item pricing breakdown
 */
export const calculateItemPricing = (item = {}, quantity = 1) => {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  // Selling price (current offer price)
  const sellingPrice = typeof item.price === 'number'
    ? Math.max(0, item.price)
    : Math.max(0, parseFloat(item.price) || 0);

  // MRP (Original price)
  const rawMrp = item.mrpPrice !== undefined
    ? item.mrpPrice
    : (item.originalPrice !== undefined ? item.originalPrice : sellingPrice);

  const mrpPrice = typeof rawMrp === 'number'
    ? Math.max(sellingPrice, rawMrp)
    : Math.max(sellingPrice, parseFloat(rawMrp) || sellingPrice);

  // Unit discount calculations
  const discountAmount = Math.max(0, Math.round((mrpPrice - sellingPrice) * 100) / 100);
  const discountPercent = mrpPrice > 0
    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
    : 0;

  // Line totals for given quantity
  const lineMrp = Math.round(mrpPrice * qty * 100) / 100;
  const lineSellingPrice = Math.round(sellingPrice * qty * 100) / 100;
  const lineSavings = Math.round(discountAmount * qty * 100) / 100;

  return {
    productCode: (item.productCode || item.code || '').toString().trim(),
    name: (item.name || 'Cracker Item').toString().trim(),
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
 * @param {Object} options Options (deliveryFee, discountSlabs, freeDeliveryThreshold, etc.)
 * @returns {Object} Complete order pricing breakdown
 */
export const calculateOrderPricing = (items = [], options = {}) => {
  const {
    deliveryFee = 0,
    discountSlabs = [],
    freeDeliveryThreshold = 3000,
    defaultDeliveryFee = 150,
  } = options;

  let orderMrpTotal = 0;
  let orderItemsSubtotal = 0;
  let orderItemSavingsTotal = 0;

  const processedItems = (Array.isArray(items) ? items : []).map((item) => {
    const itemPricing = calculateItemPricing(item, item.quantity || 1);
    orderMrpTotal += itemPricing.lineMrp;
    orderItemsSubtotal += itemPricing.lineSellingPrice;
    orderItemSavingsTotal += itemPricing.lineSavings;
    return {
      ...item,
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
      (s) => orderItemsSubtotal >= s.minAmount && s.discountPercentage > 0
    );
    if (matchingSlabs.length > 0) {
      matchingSlabs.sort(
        (a, b) => b.minAmount - a.minAmount || b.discountPercentage - a.discountPercentage
      );
      slabDiscountPercentage = matchingSlabs[0].discountPercentage;
      slabDiscountAmount = Math.round((orderItemsSubtotal * slabDiscountPercentage) / 100);
    }
  }

  // Shipping / Delivery Fee calculation
  const calculatedDeliveryFee = typeof options.deliveryFee === 'number'
    ? Math.max(0, options.deliveryFee)
    : (orderItemsSubtotal >= freeDeliveryThreshold ? 0 : defaultDeliveryFee);

  // Total Savings across items + order slab discount
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

export default {
  calculateItemPricing,
  calculateOrderPricing,
};
