
export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  bankAccount?: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName?: string;
  };
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
  aiApiKeys?: AIApiKey[]; // Array of AI API keys for the fund
  aiUsageStats?: AIUsageStats; // AI usage statistics for the fund
}

export interface AIApiKey {
  id: string; // Unique identifier for the API key
  provider: 'google' | 'openai' | 'groq'; // API provider
  key: string; // The actual API key
  label: string; // User-friendly label for the key
  createdAt: number; // When the key was added
  isActive: boolean; // Whether the key is active
}

export interface AIUsageStats {
  lastUpdated: number; // Timestamp when stats were last updated
  todayCalls: number; // Number of API calls made today
  todayDate: string; // Today's date in YYYY-MM-DD format
  totalCalls: number; // Total number of API calls made ever
  history: AIUsageHistory[]; // History of API usage
}

export interface AIUsageHistory {
  date: string; // Date in YYYY-MM-DD format
  calls: number; // Number of API calls made on this date
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
  currencyCode?: string; // ISO 4217 currency code (e.g., USD, EUR)
  originalAmount?: number; // Original amount in foreign currency
  exchangeRate?: number; // Exchange rate used for conversion
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

// Split type enum for transaction splits
export enum SplitType {
  EVEN = "even",
  CUSTOM = "custom",
  PERCENTAGE = "percentage"
}

// User with profile information
export interface UserWithProfile extends User {
  isActive?: boolean;
}
