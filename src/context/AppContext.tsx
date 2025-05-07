import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Fund, Transaction, User } from "@/types";
import { mockUsers } from "@/data/mockData";
import { toast } from "sonner";
import { 
  loginWithGoogle, 
  logoutUser, 
  onAuthStateChange 
} from "@/firebase/auth";
import { User as FirebaseUser } from "firebase/auth";
import {
  createFund as createFirebaseFund,
  getUserFunds,
  getFundById,
  updateFund as updateFirebaseFund,
  deleteFund as deleteFundService,
  addFundMember,
  removeFundMember
} from "@/firebase/fundService";
import {
  createTransaction as createFirebaseTransaction,
  getFundTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from "@/firebase/transactionService";
import {
  findUserByEmail as findUserByEmailFirestore,
  getUserById as getFirestoreUserById,
  saveUser,
  getCurrentFirestoreUser,
  syncUserWithFirestore,
  addUserToFundByEmail
} from "@/firebase/userService";

interface AppContextType {
  currentUser: User | null;
  funds: Fund[];
  transactions: Transaction[];
  selectedFund: Fund | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setSelectedFund: (fund: Fund | null) => void;
  createFund: (fund: Omit<Fund, "id" | "createdAt" | "createdBy">) => Promise<Fund | undefined>;
  updateFund: (fundId: string, fundData: Partial<Omit<Fund, "id" | "createdAt" | "createdBy">>) => Promise<boolean>;
  createTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => Promise<Transaction | undefined>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  getUserById: (id: string) => User | undefined;
  findUserByEmail: (email: string) => Promise<User | null>;
  addMemberByEmail: (fundId: string, email: string) => Promise<boolean>;
  calculateBalances: (fundId: string) => { userId: string; amount: number }[];
  isAuthLoading: boolean;
  isLoading: boolean;
  loadUserFunds: (userId: string) => Promise<void>;
  loadFundTransactions: (fundId: string) => Promise<void>;
  deleteFund: (fundId: string) => Promise<boolean>;
  getFundById: (fundId: string) => Promise<Fund | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userCache, setUserCache] = useState<Record<string, User>>({});

  // Convert Firebase user to our User type
  const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
    return {
      id: firebaseUser.uid,
      displayName: firebaseUser.displayName || "User",
      email: firebaseUser.email || "",
      photoURL: firebaseUser.photoURL || "",
    };
  };

  // Real Firebase login with Google
  const login = async () => {
    try {
      setIsAuthLoading(true);
      await loginWithGoogle();
      toast.success("Đăng nhập thành công!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đăng nhập thất bại";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Real Firebase logout
  const logout = async () => {
    try {
      setIsAuthLoading(true);
      await logoutUser();
      setSelectedFund(null);
      toast.info("Đã đăng xuất");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đăng xuất thất bại";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Get user by ID - using Firebase and local cache
  const getUserById = (id: string) => {
    // Handle null/undefined IDs
    if (!id) {
      return {
        id: 'unknown',
        displayName: 'Unknown User',
        email: '',
        photoURL: ''
      };
    }
    
    // If the current user matches the ID, return the current user
    if (currentUser && currentUser.id === id) {
      return currentUser;
    }
    
    // If we have the user in cache, return it
    if (userCache[id]) {
      return userCache[id];
    }
    
    // If not in cache, fetch from Firebase asynchronously and update cache
    getFirestoreUserById(id).then(user => {
      if (user) {
        setUserCache(prev => ({
          ...prev,
          [id]: user
        }));
      }
    }).catch(error => {
      console.error('Error fetching user:', error);
    });
    
    // Return a placeholder while loading
    const idStr = String(id);
    const shortId = idStr.substring(0, 4);
    return {
      id,
      displayName: `User ${shortId}`,
      email: '',
      photoURL: ''
    };
  };
  
  // Find a user by email using Firebase
  const findUserByEmail = async (email: string) => {
    if (!email) return null;
    
    try {
      setIsLoading(true);
      // Using the imported function from userService
      return await findUserByEmailFirestore(email);
    } catch (error) {
      console.error('Error finding user by email:', error);
      toast.error('Không thể tìm kiếm người dùng');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a user to a fund by email
  const addMemberByEmail = async (fundId: string, email: string): Promise<boolean> => {
    if (!fundId || !email) return false;
    
    try {
      setIsLoading(true);
      const result = await addUserToFundByEmail(fundId, email);
      
      if (result) {
        // Reload fund data to get updated member list
        if (currentUser) {
          await loadUserFunds(currentUser.id);
        }
        toast.success('Thành viên đã được thêm vào quỹ');
      } else {
        toast.error('Không tìm thấy người dùng với email này');
      }
      
      return result;
    } catch (error) {
      console.error('Error adding member by email:', error);
      toast.error('Không thể thêm thành viên');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's funds from Firebase
  const loadUserFunds = async (userId: string) => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const userFunds = await getUserFunds(userId);
      setFunds(userFunds);
    } catch (error) {
      console.error('Error loading funds:', error);
      toast.error('Không thể tải danh sách quỹ');
    } finally {
      setIsLoading(false);
    }
  };

  // Load transactions for a specific fund
  const loadFundTransactions = async (fundId: string) => {
    if (!fundId) return;
    
    try {
      setIsLoading(true);
      console.log('Loading transactions for fund:', fundId);
      const fundTransactions = await getFundTransactions(fundId);
      console.log('Loaded transactions:', fundTransactions);
      
      if (fundTransactions.length === 0) {
        console.log('No transactions found for fund');
        setTransactions([]);
        return;
      }
      
      // Ensure all transactions have a date field and valid properties
      const processedTransactions = fundTransactions.map(transaction => {
        // Ensure we have valid data
        const validTransaction = {
          ...transaction,
          id: transaction.id || 'unknown',
          fundId: transaction.fundId || fundId,
          description: transaction.description || 'Giao dịch',
          amount: typeof transaction.amount === 'number' ? transaction.amount : 0,
          paidBy: transaction.paidBy || '',
          splits: Array.isArray(transaction.splits) ? transaction.splits : [],
          createdAt: transaction.createdAt || Date.now(),
          date: transaction.date || transaction.createdAt || Date.now(),
        };
        return validTransaction;
      });
      
      // Sort by date in descending order
      const sortedTransactions = processedTransactions.sort((a, b) => {
        const dateA = a.date || a.createdAt;
        const dateB = b.date || b.createdAt;
        return dateB - dateA;
      });
      
      console.log('Processed transactions:', sortedTransactions);
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Không thể tải danh sách giao dịch');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new fund using Firebase
  const createFund = async (fund: Omit<Fund, "id" | "createdAt" | "createdBy">) => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const newFund = await createFirebaseFund(fund, currentUser.id);
      setFunds((prev) => [...prev, newFund]);
      setSelectedFund(newFund);
      toast.success("Đã tạo quỹ mới thành công!");
      return newFund;
    } catch (error) {
      console.error('Error creating fund:', error);
      const errorMessage = error instanceof Error ? error.message : "Không thể tạo quỹ mới";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a fund
  const deleteFund = async (fundId: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      setIsLoading(true);
      await deleteFundService(fundId);
      
      // Update local state
      setFunds((prev) => prev.filter(f => f.id !== fundId));
      
      // If the deleted fund was selected, clear the selection
      if (selectedFund?.id === fundId) {
        setSelectedFund(null);
      }
      
      toast.success("Quỹ đã được xóa thành công!");
      return true;
    } catch (error) {
      console.error('Error deleting fund:', error);
      const errorMessage = error instanceof Error ? error.message : "Không thể xóa quỹ";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new transaction using Firebase
  const createTransaction = async (transaction: Omit<Transaction, "id" | "createdAt">) => {
    try {
      setIsLoading(true);
      // Add date field if not provided
      const transactionWithDate = {
        ...transaction,
        date: transaction.date || Date.now(),
        // Use the utility function to calculate the final splits
        splits: calculateTransactionSplits(transaction)
      };
      const newTransaction = await createFirebaseTransaction(transactionWithDate);
      
      // Update local state
      setTransactions((prev) => {
        // Check if transaction already exists to avoid duplicates
        const exists = prev.some(t => t.id === newTransaction.id);
        if (exists) {
          return prev.map(t => t.id === newTransaction.id ? newTransaction : t);
        } else {
          return [...prev, newTransaction];
        }
      });
      
      toast.success("Đã thêm giao dịch mới thành công!");
      return newTransaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      const errorMessage = error instanceof Error ? error.message : "Không thể tạo giao dịch mới";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing fund
  const updateFund = async (
    fundId: string,
    fundData: Partial<Omit<Fund, "id" | "createdAt" | "createdBy">>
  ): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      setIsLoading(true);
      // Call Firebase service to update the fund
      await updateFirebaseFund(fundId, fundData);
      
      // Update local state
      setFunds((prev) => 
        prev.map((fund) => 
          fund.id === fundId ? { ...fund, ...fundData } : fund
        )
      );
      
      // If this was the selected fund, also update that reference
      if (selectedFund?.id === fundId) {
        setSelectedFund((prevFund) => 
          prevFund ? { ...prevFund, ...fundData } : prevFund
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating fund:', error);
      const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật quỹ";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate balances for a fund
  const calculateBalances = (fundId: string) => {
    const fundTransactions = transactions.filter(
      (transaction) => transaction.fundId === fundId
    );
    
    const balances: Record<string, number> = {};
    
    for (const transaction of fundTransactions) {
      for (const split of transaction.splits) {
        if (!balances[split.userId]) {
          balances[split.userId] = 0;
        }
        balances[split.userId] += split.amount;
      }
    }
    
    return Object.entries(balances).map(([userId, amount]) => ({
      userId,
      amount,
    }));
  };

  // Check for cached auth state on initial load
  useEffect(() => {
    // Try to restore from sessionStorage to avoid showing login screen unnecessarily
    const cachedUser = sessionStorage.getItem('currentUser');
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        setCurrentUser(parsedUser);
        // Set a very short loading time since we have cached data
        setTimeout(() => setIsAuthLoading(false), 50);
      } catch (e) {
        // Invalid cache, will be handled by the auth listener below
        sessionStorage.removeItem('currentUser');
      }
    }

    // Listen for authentication state changes - but don't block UI rendering
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Convert the basic firebase user first for immediate display
          const basicUser = convertFirebaseUser(firebaseUser);
          setCurrentUser(basicUser);
          // Cache the user to avoid login flickers on refresh
          sessionStorage.setItem('currentUser', JSON.stringify(basicUser));
          
          // Then load additional data in background without blocking
          const fullUser = await syncUserWithFirestore(firebaseUser);
          setCurrentUser(fullUser);
          sessionStorage.setItem('currentUser', JSON.stringify(fullUser));
          
          // Load funds in background
          loadUserFunds(fullUser.id).catch(error => {
            console.error('Error loading user funds:', error);
          });
        } catch (error) {
          console.error('Error syncing user:', error);
          // Don't show toast here to avoid disrupting the UI
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setFunds([]);
        setTransactions([]);
        sessionStorage.removeItem('currentUser');
        setIsAuthLoading(false);
      }
    });

    // Set auth loading to false after a maximum timeout
    // This ensures UI doesn't get stuck in loading state
    const loadingTimeout = setTimeout(() => {
      setIsAuthLoading(false);
    }, 2000);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);
  
  // Load transactions when a fund is selected
  useEffect(() => {
    if (selectedFund) {
      loadFundTransactions(selectedFund.id);
    }
  }, [selectedFund]);
  
  // Reload transactions periodically to ensure we have the latest data
  useEffect(() => {
    if (!selectedFund) return;
    
    // Initial load
    loadFundTransactions(selectedFund.id);
    
    // Set up interval to refresh transactions
    const intervalId = setInterval(() => {
      if (selectedFund) {
        loadFundTransactions(selectedFund.id);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [selectedFund?.id]);

  // Delete a transaction
  const deleteTransactionById = async (transactionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Call Firebase service to delete the transaction
      await deleteTransaction(transactionId);
      
      // Update local state
      setTransactions((prev) => prev.filter((transaction) => transaction.id !== transactionId));
      
      toast.success("Giao dịch đã được xóa thành công!");
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      const errorMessage = error instanceof Error ? error.message : "Không thể xóa giao dịch";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get a specific fund by ID directly from Firebase
  const fetchFundById = async (fundId: string): Promise<Fund | null> => {
    try {
      setIsLoading(true);
      // Use the imported getFundById from fundService
      const fundData = await getFundById(fundId);
      
      // If we find the fund, add it to our local state if not already there
      if (fundData) {
        // Check if fund exists in our local state
        const existingFund = funds.find(f => f.id === fundId);
        
        if (!existingFund) {
          // Add to our local state if not already there
          setFunds(prev => [...prev, fundData]);
        }
      }
      
      return fundData;
    } catch (error) {
      console.error('Error getting fund by ID:', error);
      toast.error('Không thể tải dữ liệu quỹ');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AppContext.Provider
      value={{
        currentUser,
        funds,
        transactions,
        selectedFund,
        login,
        logout,
        setSelectedFund,
        createFund,
        updateFund,
        createTransaction,
        deleteTransaction: deleteTransactionById,
        getUserById,
        findUserByEmail,
        addMemberByEmail,
        calculateBalances,
        deleteFund,
        isAuthLoading,
        isLoading,
        loadUserFunds,
        loadFundTransactions,
        getFundById: fetchFundById
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
