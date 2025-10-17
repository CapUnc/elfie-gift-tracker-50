export const formatCurrency = (amount: number, currency: string = '$'): string => {
  // Remove cents if the amount is a whole number
  const hasDecimals = amount % 1 !== 0;
  const formatted = hasDecimals ? amount.toFixed(2) : amount.toString();
  
  // Add thousand separators for amounts >= 1000
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${currency}${parts.join('.')}`;
};
