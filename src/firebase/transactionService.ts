import { db } from './config';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Transaction } from '@/types';

// Collection reference
const TRANSACTIONS_COLLECTION = 'transactions';
const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);

/**
 * Create a new transaction
 * @param transaction Transaction data without id and createdAt
 * @returns The created transaction with ID
 */
export const createTransaction = async (
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction> => {
  try {
    // Create a timestamp for now
    const now = Date.now();
    
    // Ensure splits is an array
    const validSplits = Array.isArray(transaction.splits) ? transaction.splits : [];
    
    // Add timestamp
    const transactionData = {
      ...transaction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Ensure we have a date field for consistent querying
      date: now,
      // Ensure splits is valid
      splits: validSplits,
      // Ensure amount is a number
      amount: typeof transaction.amount === 'number' ? transaction.amount : 0,
      // Ensure description is a string
      description: transaction.description || 'Giao dịch',
    };
    
    // Add to Firestore
    const docRef = await addDoc(transactionsRef, transactionData);
    
    // Return the created transaction with ID
    return {
      ...transactionData,
      id: docRef.id,
      createdAt: now,
      date: now,
      // Convert server timestamp back to number for client use
      updatedAt: now,
    } as Transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

/**
 * Get all transactions for a fund
 * @param fundId Fund ID
 * @returns Array of transactions
 */
export const getFundTransactions = async (fundId: string): Promise<Transaction[]> => {
  try {
    // Query transactions for the fund
    const q = query(
      transactionsRef, 
      where('fundId', '==', fundId)
      // Remove orderBy to avoid index issues
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to milliseconds
      let createdAt = Date.now();
      if (data.createdAt instanceof Timestamp) {
        createdAt = data.createdAt.toMillis();
      } else if (typeof data.createdAt === 'number') {
        createdAt = data.createdAt;
      }
      
      // Ensure date field exists
      let date = createdAt;
      if (data.date instanceof Timestamp) {
        date = data.date.toMillis();
      } else if (typeof data.date === 'number') {
        date = data.date;
      }
      
      // Create a complete transaction object
      return {
        ...data,
        id: doc.id,
        createdAt,
        date,
        // Ensure splits is always an array
        splits: Array.isArray(data.splits) ? data.splits : [],
        // Ensure amount is a number
        amount: typeof data.amount === 'number' ? data.amount : 0,
        // Ensure description is a string
        description: data.description || 'Giao dịch',
      } as Transaction;
    });
  } catch (error) {
    console.error('Error getting fund transactions:', error);
    throw error;
  }
};

/**
 * Get a transaction by ID
 * @param transactionId Transaction ID
 * @returns Transaction data or null if not found
 */
export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamp to milliseconds
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toMillis() 
        : Date.now();
      
      return {
        ...data,
        id: docSnap.id,
        createdAt,
      } as Transaction;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
};

/**
 * Update a transaction
 * @param transactionId Transaction ID
 * @param transactionData Updated transaction data
 * @returns Promise that resolves when update is complete
 */
export const updateTransaction = async (
  transactionId: string, 
  transactionData: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    
    // Add updated timestamp
    await updateDoc(docRef, {
      ...transactionData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

/**
 * Delete a transaction
 * @param transactionId Transaction ID
 * @returns Promise that resolves when deletion is complete
 */
export const deleteTransaction = async (transactionId: string): Promise<void> => {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

/**
 * Get transactions by user (where user is payer or included in splits)
 * @param userId User ID
 * @returns Array of transactions
 */
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    // First get transactions where user is payer
    const payerQuery = query(
      transactionsRef, 
      where('paidBy', '==', userId),
      orderBy('date', 'desc')
    );
    
    const payerSnapshot = await getDocs(payerQuery);
    const payerTransactions = payerSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toMillis() 
        : Date.now();
      
      return {
        ...data,
        id: doc.id,
        createdAt,
      } as Transaction;
    });
    
    // Unfortunately, Firestore doesn't support array-contains queries on nested fields
    // So we need to get all transactions and filter client-side for splits
    // In a production app, you might want to denormalize this data for better querying
    const allTransactionsQuery = query(
      transactionsRef,
      orderBy('date', 'desc')
    );
    
    const allSnapshot = await getDocs(allTransactionsQuery);
    const splitTransactions = allSnapshot.docs
      .map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toMillis() 
          : Date.now();
        
        return {
          ...data,
          id: doc.id,
          createdAt,
        } as Transaction;
      })
      .filter(transaction => 
        transaction.splits.some(split => split.userId === userId)
      );
    
    // Combine and deduplicate transactions
    const allUserTransactions = [...payerTransactions, ...splitTransactions];
    const uniqueTransactions = Array.from(
      new Map(allUserTransactions.map(item => [item.id, item])).values()
    );
    
    return uniqueTransactions;
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
};
