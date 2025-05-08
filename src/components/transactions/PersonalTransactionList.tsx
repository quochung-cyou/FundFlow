import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { Fund, Transaction } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TransactionRow } from "./TransactionRow";
import { ChevronDown, Search, AlertCircle, UserRound, ArrowDownUp, Clock, ArrowDown, ArrowUp, Filter } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface PersonalTransactionListProps {
  fund: Fund;
  searchQuery?: string;
  dateRange?: DateRange;
}

export function PersonalTransactionList({ fund, searchQuery = "", dateRange }: PersonalTransactionListProps) {
  const { transactions, getUserById, currentUser } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "amount">("newest");
  const [activeTab, setActiveTab] = useState<"owed" | "owes">("owed");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Use the external search query if provided
    if (searchQuery !== undefined) {
      setLocalSearchTerm(searchQuery);
    }
  }, [searchQuery]);
  
  // Get all personal transactions (both money owed to user and money user owes)
  const allPersonalTransactions = transactions
    .filter(transaction => transaction.fundId === fund.id)
    .filter(transaction => {
      if (!currentUser) return false;
      
      // Find the current user's split in this transaction
      const userSplit = transaction.splits.find(split => split.userId === currentUser.id);
      if (!userSplit) return false;
      
      // For "owed" tab: user has negative split (is owed money) and there are positive splits (people who owe money)
      if (activeTab === "owed") {
        return userSplit.amount > 0;
      }
      
      // For "owes" tab: user has positive split (owes money) and there are negative splits (people who are owed money)
      if (activeTab === "owes") {
        return userSplit.amount < 0; 
      }
      
      return false;
    })
    .filter(transaction => {
      const searchLowerCase = localSearchTerm.toLowerCase();
      if (searchLowerCase === "") return true;
      
      // Search by description
      if (transaction.description.toLowerCase().includes(searchLowerCase)) {
        return true;
      }
      
      // Search by amount
      if (transaction.amount.toString().includes(searchLowerCase)) {
        return true;
      }
      
      // Search by user name
      const splitsMatch = transaction.splits.some(split => {
        // For "owed" tab, only consider positive splits (people who owe money)
        // For "owes" tab, only consider negative splits (people who are owed money)
        if (activeTab === "owed" && split.amount <= 0) return false;
        if (activeTab === "owes" && split.amount >= 0) return false;
        
        const user = getUserById(split.userId);
        return user && user.displayName.toLowerCase().includes(searchLowerCase);
      });
      
      return splitsMatch;
    })
    .filter(transaction => {
      // Date range filtering
      if (dateRange?.from && dateRange?.to) {
        const transactionDate = new Date(transaction.createdAt);
        return isWithinInterval(transactionDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        });
      } else if (dateRange?.from) {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= startOfDay(dateRange.from);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return b.createdAt - a.createdAt;
      } else if (sortOrder === "oldest") {
        return a.createdAt - b.createdAt;
      } else if (sortOrder === "amount") {
        // Sort by the absolute amount
        if (!currentUser) return 0;
        
        const userSplitA = a.splits.find(split => split.userId === currentUser.id);
        const userSplitB = b.splits.find(split => split.userId === currentUser.id);
        
        const amountA = userSplitA ? Math.abs(userSplitA.amount) : 0;
        const amountB = userSplitB ? Math.abs(userSplitB.amount) : 0;
        
        return amountB - amountA; // Largest amount first
      }
      return 0;
    });

  // Group transactions by date
  const groupByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    
    transactions.forEach((transaction) => {
      const date = format(transaction.createdAt, 'dd/MM/yyyy');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return Object.entries(groups).map(([date, transactions]) => ({
      date,
      transactions,
    }));
  };

  const groupedTransactions = groupByDate(allPersonalTransactions);
  
  // Calculate total amount for the current tab
  const calculateTotalAmount = () => {
    if (!currentUser) return 0;
    
    return allPersonalTransactions.reduce((total, transaction) => {
      const userSplit = transaction.splits.find(split => split.userId === currentUser.id);
      if (!userSplit) return total;
      return total + Math.abs(userSplit.amount);
    }, 0);
  };
  
  const totalAmount = calculateTotalAmount();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Card className="h-[500px] flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="pb-2 border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Giao dịch cá nhân</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search input */}
            {!searchQuery && (
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={activeTab === "owed" ? "Tìm người nợ..." : "Tìm chủ nợ..."} 
                  className="pl-8 h-8 text-sm w-full"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                />
              </div>
            )}
            
            {/* Sort order selector */}
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "newest" | "oldest" | "amount")}>
              <SelectTrigger className="h-8 w-[100px]">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="amount">Số tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Transaction type tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "owed" | "owes")} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="owed" className="flex items-center gap-1">
              <ArrowDown className="h-3.5 w-3.5 text-green-600" />
              <span>Tiền nhận</span>
            </TabsTrigger>
            <TabsTrigger value="owes" className="flex items-center gap-1">
              <ArrowUp className="h-3.5 w-3.5 text-red-600" />
              <span>Tiền trả</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Total amount summary */}
        {totalAmount > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100 flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700">
              {activeTab === "owed" ? "Tổng tiền nhận:" : "Tổng tiền trả:"}
            </span>
            <Badge variant="outline" className={cn(
              "font-semibold",
              activeTab === "owed" 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200"
            )}>
              {formatCurrency(Math.round(totalAmount))}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-hidden"
          >
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="px-4 pb-4 space-y-6">
                  {allPersonalTransactions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-3 text-xl opacity-50"
                      >
                        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-30" />
                      </motion.div>
                      {localSearchTerm || dateRange?.from ? (
                        <p>Không tìm thấy giao dịch nào phù hợp</p>
                      ) : (
                        <p>{activeTab === "owed" ? "Chưa có ai nợ bạn" : "Bạn chưa nợ ai"}</p>
                      )}
                    </div>
                  ) : (
                    <AnimatePresence>
                      {groupedTransactions.map((group) => (
                        <motion.div 
                          key={group.date} 
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="sticky top-0 bg-card/90 backdrop-blur-sm z-10 py-2 font-medium text-sm text-muted-foreground border-b border-border/50">
                            {format(new Date(group.transactions[0].createdAt), "EEEE, dd/MM/yyyy", { locale: vi })}
                          </div>
                          <div className="space-y-2">
                            <AnimatePresence>
                              {group.transactions.map((transaction, index) => {
                                // Get the current user's split
                                const userSplit = transaction.splits.find(split => 
                                  currentUser && split.userId === currentUser.id
                                );
                                const amount = userSplit ? Math.abs(userSplit.amount) : 0;
                                
                                // Find relevant users based on the active tab
                                const relevantUsers = transaction.splits
                                  .filter(split => {
                                    if (activeTab === "owed") {
                                      return split.amount > 0; // People who owe money (positive splits)
                                    } else {
                                      return split.amount < 0; // People who are owed money (negative splits)
                                    }
                                  })
                                  .map(split => getUserById(split.userId)?.displayName || 'Unknown')
                                  .join(', ');
                                
                                return (
                                  <motion.div
                                    key={transaction.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ 
                                      duration: 0.3, 
                                      delay: index * 0.05,
                                    }}
                                    className="relative"
                                  >
                                    <Badge variant="outline" className={cn(
                                      "absolute right-3 top-3 z-10",
                                      activeTab === "owed" 
                                        ? "bg-green-50 text-green-700 hover:bg-green-100" 
                                        : "bg-red-50 text-red-700 hover:bg-red-100"
                                    )}>
                                      {activeTab === "owed" ? "Nhận" : "Trả"} {formatCurrency(Math.round(amount))}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground mb-1 pl-2">
                                      <span className="font-medium">
                                        {activeTab === "owed" ? "Người nợ:" : "Chủ nợ:"}
                                      </span> {relevantUsers}
                                    </div>
                                    <TransactionRow transaction={transaction} />
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
