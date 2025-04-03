import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Fund, Transaction, User } from "@/types";
import { mockFunds, mockTransactions, mockUsers } from "@/data/mockData";
import { toast } from "sonner";

interface AppContextType {
  currentUser: User | null;
  funds: Fund[];
  transactions: Transaction[];
  selectedFund: Fund | null;
  login: () => void;
  logout: () => void;
  setSelectedFund: (fund: Fund | null) => void;
  createFund: (fund: Omit<Fund, "id" | "createdAt" | "createdBy">) => void;
  createTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => void;
  getUserById: (id: string) => User | undefined;
  calculateBalances: (fundId: string) => { userId: string; amount: number }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [funds, setFunds] = useState<Fund[]>(mockFunds);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);

  // Simulate login
  const login = () => {
    setCurrentUser(mockUsers[0]);
    toast.success("Đăng nhập thành công!");
  };

  // Simulate logout
  const logout = () => {
    setCurrentUser(null);
    setSelectedFund(null);
    toast.info("Đã đăng xuất");
  };

  // Get user by ID
  const getUserById = (id: string) => {
    return mockUsers.find((user) => user.id === id);
  };

  // Create a new fund
  const createFund = (fund: Omit<Fund, "id" | "createdAt" | "createdBy">) => {
    if (!currentUser) return;
    
    const newFund: Fund = {
      ...fund,
      id: `fund-${Date.now()}`,
      createdAt: Date.now(),
      createdBy: currentUser.id,
    };
    
    setFunds((prev) => [...prev, newFund]);
    setSelectedFund(newFund);
    toast.success("Đã tạo quỹ mới thành công!");
  };

  // Create a new transaction
  const createTransaction = (transaction: Omit<Transaction, "id" | "createdAt">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `transaction-${Date.now()}`,
      createdAt: Date.now(),
    };
    
    setTransactions((prev) => [...prev, newTransaction]);
    toast.success("Đã thêm giao dịch mới thành công!");
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

  useEffect(() => {
    // For demo purposes, default to logged in state
    // In a real app, you'd check for an existing session here
    login();
  }, []);

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
        createTransaction,
        getUserById,
        calculateBalances,
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
