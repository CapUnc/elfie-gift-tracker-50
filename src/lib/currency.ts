export const formatCurrency = (amount: number, currency: string = '$'): string => {
  return `${currency}${amount.toFixed(2)}`;
};

export const getCurrencySymbol = (): string => {
  const savedCurrency = localStorage.getItem('christmas-gifts-currency');
  return savedCurrency || '$';
};