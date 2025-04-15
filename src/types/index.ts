
export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  icon: string;
  members: string[]; // Array of user IDs for better Firebase integration
  createdAt: number;
  createdBy: string;
  updatedAt?: number; // Optional timestamp for updates
  currency?: string; // Optional currency code
  isArchived?: boolean; // Optional flag to archive funds
}

export interface Transaction {
  id: string;
  fundId: string;
  description: string;
  amount: number;
  paidBy: string; // User ID of who paid
  splits: Split[];
  createdAt: number;
  updatedAt?: number; // Optional timestamp for updates
  date?: number; // Optional date of the transaction (different from createdAt)
  category?: string; // Optional category
  notes?: string; // Optional notes
  attachments?: string[]; // Optional array of attachment URLs
}

export interface Split {
  userId: string;
  amount: number;
}

export interface Balance {
  userId: string;
  amount: number;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// For Firebase query results
export interface FirestoreDocument<T> {
  id: string;
  data: T;
}
