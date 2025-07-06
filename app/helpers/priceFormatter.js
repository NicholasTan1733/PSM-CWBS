// priceFormatter.js - Helper function for consistent price formatting

export const formatPrice = (price) => {
  const numPrice = parseFloat(price);
  
  // Handle invalid prices
  if (isNaN(numPrice)) {
    return 'RM0.00';
  }
  
  // If it's a whole number, show without decimals but with .00
  if (numPrice % 1 === 0) {
    return `RM${numPrice.toFixed(0)}.00`;
  }
  
  // Otherwise show with 2 decimal places
  return `RM${numPrice.toFixed(2)}`;
};

// Alternative format without RM prefix (for input fields)
export const formatPriceNumber = (price) => {
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice)) {
    return '0.00';
  }
  
  if (numPrice % 1 === 0) {
    return `${numPrice.toFixed(0)}.00`;
  }
  
  return numPrice.toFixed(2);
};

// Format for display with dollar sign (legacy support)
export const formatPriceDollar = (price) => {
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice)) {
    return '$0.00';
  }
  
  if (numPrice % 1 === 0) {
    return `$${numPrice.toFixed(0)}.00`;
  }
  
  return `$${numPrice.toFixed(2)}`;
};