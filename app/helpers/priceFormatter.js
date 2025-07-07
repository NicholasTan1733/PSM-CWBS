export const formatPrice = (price) => {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) {
    return 'RM0.00';
  }

  if (numPrice % 1 === 0) {
    return `RM${numPrice.toFixed(0)}.00`;
  }

  return `RM${numPrice.toFixed(2)}`;
};

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