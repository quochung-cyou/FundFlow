import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with thousand separators in Vietnamese format
 * @param amount Number to format
 * @returns Formatted string with thousand separators
 */
export function formatNumberWithSeparators(amount: number | string): string {
  if (typeof amount === 'string') {
    amount = parseInt(amount);
    if (isNaN(amount)) return '0';
  }
  
  return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Format currency as VND
 * @param amount Amount in VND
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string): string {
  if (typeof amount === 'string') {
    amount = parseInt(amount);
    if (isNaN(amount)) return '0 ₫';
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Convert a number to Vietnamese text representation
 * @param amount Number to convert
 * @returns Vietnamese text representation (e.g., "1 triệu 200 nghìn")
 */
export function numberToVietnameseText(amount: number | string): string {
  if (typeof amount === 'string') {
    amount = parseInt(amount);
    if (isNaN(amount)) return '';
  }
  
  if (amount === 0) return 'không đồng';
  
  // Handle negative numbers
  if (amount < 0) {
    return 'âm ' + numberToVietnameseText(Math.abs(amount));
  }
  
  const trillion = Math.floor(amount / 1000000000000);
  amount %= 1000000000000;
  
  const billion = Math.floor(amount / 1000000000);
  amount %= 1000000000;
  
  const million = Math.floor(amount / 1000000);
  amount %= 1000000;
  
  const thousand = Math.floor(amount / 1000);
  amount %= 1000;
  
  const result: string[] = [];
  
  if (trillion > 0) {
    result.push(`${trillion} nghìn tỷ`);
  }
  
  if (billion > 0) {
    result.push(`${billion} tỷ`);
  }
  
  if (million > 0) {
    result.push(`${million} triệu`);
  }
  
  if (thousand > 0) {
    result.push(`${thousand} nghìn`);
  }
  
  if (amount > 0) {
    result.push(`${amount} đồng`);
  }
  
  return result.join(' ');
}
