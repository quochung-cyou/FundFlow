import { Transaction, Split } from "@/types";

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
 * @param transaction - The transaction with split information
 * @returns The final splits array with validated amounts
 */
export const calculateTransactionSplits = (
  transaction: Omit<Transaction, "id" | "createdAt">
): Split[] => {
  // If transaction already has valid splits, return them as is
  if (transaction.splits && transaction.splits.length > 0) {
    // Validate that the sum of all splits equals the transaction amount
    const totalSplitAmount = transaction.splits.reduce(
      (sum, split) => sum + Math.abs(split.amount), 
      0
    );
    
    // If splits are already balanced (within a small rounding error), return as is
    if (Math.abs(totalSplitAmount - Math.abs(transaction.amount)) < 0.01) {
      return transaction.splits;
    }
  }

  // If no valid splits exist or they don't balance, calculate them
  // Default behavior: create a split where the payer pays the full amount 
  // and others are debtors with negative amounts
  const newSplits: Split[] = [];
  
  // Add the payer's split (positive amount - they paid)
  newSplits.push({
    userId: transaction.paidBy,
    amount: transaction.amount
  });
  
  // If there are specific split distributions, process them
  // This could be extended based on the application's specific requirements
  
  return newSplits;
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
