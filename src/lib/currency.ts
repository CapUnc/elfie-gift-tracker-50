import { DataService } from '@/services/dataService';

export const formatCurrency = (amount: number, currency?: string): string => {
  const currencySymbol = currency || DataService.getCurrency();
  
  // Remove cents if the amount is a whole number
  const hasDecimals = amount % 1 !== 0;
  const formatted = hasDecimals ? amount.toFixed(2) : amount.toString();
  
  // Add thousand separators for amounts >= 1000
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${currencySymbol}${parts.join('.')}`;
};

export const getCurrencySymbol = (): string => {
  return DataService.getCurrency();
};