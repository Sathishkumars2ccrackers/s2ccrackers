/**
 * Format numeric value as Indian Rupee currency (e.g. ₹1,450)
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format ISO date string into readable Indian standard format
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat('en-IN', options).format(date);
};

/**
 * Calculate savings amount between original and current price
 */
export const calculateSavings = (originalPrice, currentPrice) => {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return originalPrice - currentPrice;
};

/**
 * Format catalog product code into standard Sivakasi catalog format (e.g. #01, #02, #10, #63)
 */
export const formatProductCode = (code) => {
  if (code === undefined || code === null || code === '') return '—';
  const clean = String(code).trim().replace(/^#+/, '');
  if (!clean) return '—';
  // Pad single digits to at least 2 digits (e.g. 1 -> #01, 9 -> #09, 10 -> #10)
  if (/^\d+$/.test(clean)) {
    return `#${clean.padStart(2, '0')}`;
  }
  return `#${clean}`;
};

/**
 * Extract integer number from product code string (e.g. "#01" -> 1, "#63" -> 63, "10" -> 10, "SC-004" -> 4).
 * Returns 999999 if no number found.
 */
export const getCodeNumber = (code) => {
  if (code === undefined || code === null || code === '') return 999999;
  const clean = String(code).trim().replace(/^#+/, '');
  const match = clean.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return isNaN(num) ? 999999 : num;
  }
  const num = parseInt(clean, 10);
  return isNaN(num) ? 999999 : num;
};

/**
 * Natural numeric sort comparator for product codes (e.g. #01, #02, #09, #10, #63)
 * Guarantees #2 is sorted before #10, and #01 before #02.
 */
export const naturalProductCodeSort = (a, b) => {
  const numA = getCodeNumber(a?.productCode ?? a?.code);
  const numB = getCodeNumber(b?.productCode ?? b?.code);

  if (numA !== numB) return numA - numB;
  return (a?.name || '').localeCompare(b?.name || '');
};

/**
 * Single shared product sorting function.
 * Always sorts products in true ascending numeric order by product code (#01, #02, ... #63).
 * Falls back to alphabetical name comparison if codes are identical.
 */
export const sortProductsByCode = (products) => {
  if (!Array.isArray(products)) return [];
  return [...products].sort(naturalProductCodeSort);
};
