import { Transaction, Split } from "@/types";
import { formatNumberWithSeparators } from "@/lib/utils";
import { numberToVietnameseText as numberToVNText } from "@/lib/utils";

// Re-export the function to fix import issues
export const numberToVietnameseText = numberToVNText;

/**
 * Calculates the total amount for a transaction based on its splits.
 * Returns the sum of all positive amounts in the splits array.
 * 
 * @param transaction - The transaction to calculate the amount for
 * @returns The total positive amount from splits
 */
export const calculateTransactionAmount = (transaction: Transaction): number => {
  // Sum up all positive amounts in the splits array
  return transaction.splits.reduce((total, split) => {
    // Only add positive amounts
    return total + (split.amount > 0 ? split.amount : 0);
  }, 0);
};

/**
 * Calculates or validates transaction splits based on the transaction data.
 * Ensures that the splits reflect the correct distribution of the transaction amount.
 * 
 * This function handles both sides of a transaction:
 * 1. The payer (person who paid) gets a positive split amount
 * 2. The recipients/debtors (people who owe money) get negative split amounts
 * 
 * In a complete transaction, the sum of all splits should be zero, indicating
 * that the money paid equals the money owed.
 * 
 * @param transaction - The transaction with split information
 * @returns The final splits array with positive splits for payers and negative splits for debtors
 */
export const calculateTransactionSplits = (
  transaction: Omit<Transaction, "id" | "createdAt">
): Split[] => {
  return transaction.splits;
};

/**
 * Calculates the total expense for an array of transactions based on their splits.
 * For each transaction, sums up all positive amounts in the splits array.
 * 
 * @param transactions - Array of transactions to calculate total expense for
 * @returns The total expense amount
 */
export const calculateTotalExpense = (transactions: Transaction[]): number => {
  return transactions.reduce((total, transaction) => {
    return total + calculateTransactionAmount(transaction);
  }, 0);
};

/**
 * Calculates the daily expenses from a list of transactions.
 * Groups transactions by date and calculates the total expense for each day.
 * 
 * @param transactions - Array of transactions
 * @param dateFormat - Function to format a date to a string key (e.g., 'yyyy-MM-dd')
 * @returns Record with date keys and expense values
 */
export const calculateDailyExpenses = (
  transactions: Transaction[],
  dateFormat: (date: Date) => string
): Record<string, { expense: number; count: number }> => {
  const dailyExpenseMap: Record<string, { expense: number; count: number }> = {};
  
  transactions.forEach(transaction => {
    // Use date or createdAt, and extract only the date part
    const transactionDate = transaction.date 
      ? new Date(transaction.date) 
      : new Date(transaction.createdAt);
    
    const dateKey = dateFormat(transactionDate);
    
    if (!dailyExpenseMap[dateKey]) {
      dailyExpenseMap[dateKey] = { expense: 0, count: 0 };
    }
    
    dailyExpenseMap[dateKey].expense += calculateTransactionAmount(transaction);
    dailyExpenseMap[dateKey].count += 1;
  });
  
  return dailyExpenseMap;
};

/**
 * Format amount for display with thousand separators
 */
export const formatAmountForDisplay = (value: string): string => {
  if (!value) return '';
  
  const isNegative = value.startsWith('-');
  const numericValue = parseInt(value);
  if (isNaN(numericValue)) return '';
  
  return formatNumberWithSeparators(numericValue);
};

/**
 * Format amount as Vietnamese currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format number with Vietnamese locale
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Sanitize amount input to allow only digits and negative sign
 */
export const sanitizeAmountInput = (value: string): string => {
  // Allow negative sign at the beginning and digits
  value = value.replace(/[^-\d]/g, '');
  
  // Only allow one negative sign at the beginning
  if (value.startsWith('-')) {
    const digits = value.substring(1).replace(/-/g, '');
    value = '-' + digits;
  } else {
    value = value.replace(/-/g, '');
  }
  
  return value;
};

/**
 * Calculate even distribution of amount among members
 */
export const calculateEvenDistribution = (
  totalAmount: number, 
  memberIds: string[], 
  payerId: string
): { userId: string; amount: number }[] => {
  const numMembers = memberIds.length;
  
  if (!totalAmount || numMembers <= 1) return [];
  
  const sharePerMember = Math.floor(totalAmount / numMembers);
  const remainder = totalAmount - (sharePerMember * numMembers);
  
  return memberIds.map((memberId, index) => {
    // Everyone has a negative share representing what they owe
    const share = -(sharePerMember + (index === 0 ? remainder : 0));
    
    if (memberId === payerId) {
      // For the payer: they paid the total amount but also owe their share
      return {
        userId: memberId,
        amount: totalAmount + share
      };
    } else {
      // For everyone else: they just owe their share
      return {
        userId: memberId,
        amount: share
      };
    }
  });
};

/**
 * Add zeros to the end of amount string
 */
export const addZerosToAmount = (currentAmount: string, zeroCount: number): string => {
  if (!currentAmount) {
    return '0'.repeat(zeroCount);
  }
  return currentAmount + '0'.repeat(zeroCount);
};
