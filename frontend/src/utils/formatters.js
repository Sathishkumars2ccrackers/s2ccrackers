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
 * Natural numeric sort comparator for product codes (e.g. #01, #02, #09, #10, #63)
 * Guarantees #2 is sorted before #10, and #01 before #02.
 */
export const naturalProductCodeSort = (a, b) => {
  const rawA = (a?.productCode ?? a?.code ?? '').toString().trim().replace(/^#+/, '');
  const rawB = (b?.productCode ?? b?.code ?? '').toString().trim().replace(/^#+/, '');

  if (!rawA && !rawB) return (a?.name || '').localeCompare(b?.name || '');
  if (!rawA) return 1;
  if (!rawB) return -1;

  const numA = parseInt(rawA, 10);
  const numB = parseInt(rawB, 10);

  if (!isNaN(numA) && !isNaN(numB)) {
    if (numA !== numB) return numA - numB;
  }

  return rawA.localeCompare(rawB, undefined, { numeric: true, sensitivity: 'base' });
};
