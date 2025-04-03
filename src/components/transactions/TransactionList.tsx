
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { Fund, Transaction } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TransactionRow } from "./TransactionRow";
import { ChevronDown, Clock, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionListProps {
  fund: Fund;
}

export function TransactionList({ fund }: TransactionListProps) {
  const { transactions } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => transaction.fundId === fund.id)
    .filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </CardTitle>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm giao dịch..." 
              className="pl-8 h-8 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                        📋
                      </motion.div>
                      {searchTerm ? (
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
