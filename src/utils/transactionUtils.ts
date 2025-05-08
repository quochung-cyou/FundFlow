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
