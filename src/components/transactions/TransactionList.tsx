
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { Fund, Transaction } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TransactionRow } from "./TransactionRow";
import { ChevronDown, Clock, Search, AlertCircle, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface TransactionListProps {
  fund: Fund;
  searchQuery?: string;
  dateRange?: DateRange;
}

// Utility function to check if a transaction is valid (split sum equals zero)
const isTransactionValid = (transaction: Transaction): boolean => {
  const sum = transaction.splits.reduce((acc, split) => acc + split.amount, 0);
  // Use a small epsilon value to handle floating point precision issues
  return Math.abs(sum) < 0.01;
};

export function TransactionList({ fund, searchQuery = "", dateRange }: TransactionListProps) {
  const { transactions, getUserById } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [showInvalidOnly, setShowInvalidOnly] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Count invalid transactions
  const invalidTransactionsCount = transactions
    .filter(transaction => transaction.fundId === fund.id)
    .filter(transaction => !isTransactionValid(transaction))
    .length;
  
  useEffect(() => {
    // Use the external search query if provided
    if (searchQuery !== undefined) {
      setLocalSearchTerm(searchQuery);
    }
  }, [searchQuery]);
  
  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => transaction.fundId === fund.id)
    // Filter by invalid transactions if the toggle is on
    .filter(transaction => {
      if (showInvalidOnly) {
        return !isTransactionValid(transaction);
      }
      return true;
    })
    .filter(transaction => {
      const searchLowerCase = localSearchTerm.toLowerCase();
      
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
    .sort((a, b) => b.createdAt - a.createdAt);

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

  const groupedTransactions = groupByDate(filteredTransactions);

  // Scroll to top when new transactions are added
  useEffect(() => {
    if (scrollAreaRef.current && filteredTransactions.length > 0) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [filteredTransactions.length]);

  return (
    <Card className="h-[500px] flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="pb-2 border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Lịch sử giao dịch</span>
            {invalidTransactionsCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 ml-1">
                      <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                      {invalidTransactionsCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{invalidTransactionsCount} giao dịch không hợp lệ</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </CardTitle>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Invalid transactions filter toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="invalid-filter"
                checked={showInvalidOnly}
                onCheckedChange={setShowInvalidOnly}
                className="data-[state=checked]:bg-amber-500"
              />
              <Label htmlFor="invalid-filter" className="text-xs cursor-pointer flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                Chỉ hiện giao dịch lỗi
              </Label>
            </div>
            
            {/* Only show the local search if not using the external search */}
            {!searchQuery && (
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm giao dịch..." 
                  className="pl-8 h-8 text-sm w-full"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
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
                  {groupedTransactions.length === 0 ? (
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
                        <p>Chưa có giao dịch nào</p>
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
                              {group.transactions.map((transaction, index) => (
                                <motion.div
                                  key={transaction.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ 
                                    duration: 0.3, 
                                    delay: index * 0.05,
                                  }}
                                >
                                  <TransactionRow transaction={transaction} />
                                </motion.div>
                              ))}
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
