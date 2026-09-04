const crypto = require('crypto');

/**
 * Generates a unique, high-entropy Order ID formatted as:
 * S2C-YYYYMMDD-XXXXXX
 * Example: S2C-20260829-584231
 */
const generateOrderId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateSegment = `${year}${month}${day}`;

  // Generate 6 digit cryptographically random numeric string
  const randomNum = crypto.randomInt(100000, 999999);

  return `S2C-${dateSegment}-${randomNum}`;
};

module.exports = { generateOrderId };
