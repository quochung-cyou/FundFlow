import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from "@/context/AppContext";
import { Transaction } from "@/types";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, User, Trash2, ChevronDown, ChevronUp, Calendar, AlertTriangle, Copy, Check, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TransactionRowProps {
  transaction: Transaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { getUserById, deleteTransaction } = useApp();
  const payer = getUserById(transaction.paidBy);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [splitSumError, setSplitSumError] = useState<number | null>(null);
  const [showTransactionId, setShowTransactionId] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };
  
  // Calculate the sum of all split amounts
  const calculateSplitSum = () => {
    const sum = transaction.splits.reduce((acc, split) => acc + split.amount, 0);
    // Use a small epsilon value to handle floating point precision issues
    return Math.abs(sum) < 0.01 ? 0 : sum;
  };
  
  // Check if split amounts sum to zero on component mount
  useEffect(() => {
    const sum = calculateSplitSum();
    if (sum !== 0) {
      setSplitSumError(sum);
    } else {
      setSplitSumError(null);
    }
  }, [transaction.splits]);
  
  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    setIsDeleteDialogOpen(false);
  };
  
  const copyTransactionId = () => {
    navigator.clipboard.writeText(transaction.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Determine if description is long enough to truncate
  const isLongDescription = transaction.description.length > 80;

  if (!payer) return null;

  return (
    <motion.div 
      className={cn(
        "p-4 rounded-lg mb-3 border border-border/40 transition-all duration-300 relative group",
        isExpanded ? "bg-blue-50/80 shadow-md" : "bg-card hover:border-blue-200 hover:bg-blue-50/50"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      layout
    >
      {/* Split sum error warning */}
      {splitSumError !== null && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-md flex items-center gap-2 text-amber-700">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <div className="text-xs">
            <span className="font-medium">Cảnh báo:</span> Tổng số tiền chia không bằng 0 
            (<span className="font-semibold">{formatCurrency(splitSumError)}</span>)
          </div>
        </div>
      )}
      
      {/* Transaction ID display (conditionally shown) */}
      <AnimatePresence>
        {showTransactionId && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-2 p-2 bg-secondary/50 border border-border rounded-md flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-muted-foreground">{transaction.id}</span>
            </div>
            <button
              onClick={copyTransactionId}
              className="p-1 hover:bg-secondary rounded-md transition-colors"
              title="Copy transaction ID"
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main transaction row content */}
      <div className="flex justify-between items-start gap-4">
        {/* Left side: Avatar and transaction info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar className={cn(
              "h-12 w-12 transition-all duration-300 bg-gradient-to-br from-blue-400 to-blue-600 ring-2",
              isExpanded ? "ring-blue-300" : "ring-blue-100"
            )}>
              <AvatarImage src={payer.photoURL} alt={payer.displayName} />
              <AvatarFallback>
                <User className="h-5 w-5 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 
              flex items-center justify-center text-[10px] text-white font-medium border-2 border-white"
            >
              {transaction.splits.length}
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            {/* Transaction description with toggle for long descriptions */}
            <div className="flex flex-col mb-1">
              <div 
                className={cn(
                  "font-medium text-sm sm:text-base transition-colors duration-300 break-words pr-2",
                  isLongDescription && !showFullDescription ? "line-clamp-2" : ""
                )}
              >
                {transaction.description}
              </div>
              
              {/* Show more/less button for long descriptions */}
              {isLongDescription && (
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium mt-1 flex items-center"
                >
                  {showFullDescription ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Ẩn bớt
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Xem thêm
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Payment info row */}
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
              <span className="font-medium text-blue-600">{payer.displayName}</span> 
              <span>đã trả</span> 
              <Badge variant="outline" className={cn(
                "text-xs py-0.5 h-5 transition-colors duration-300 border-blue-200",
                "bg-blue-50 text-blue-700 font-medium"
              )}>
                {formatCurrency(transaction.amount)}
              </Badge>
              
              {/* Date info on mobile */}
              <div className="hidden sm:flex items-center gap-1 ml-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(transaction.createdAt, "dd/MM/yyyy")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Time, split indicators, and delete button */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Transaction ID and Delete buttons */}
          <div className="flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">            
            {/* Transaction ID button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                    aria-label="Show transaction ID"
                    onClick={() => setShowTransactionId(!showTransactionId)}
                  >
                    <Hash className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{showTransactionId ? 'Hide' : 'Show'} transaction ID</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Delete button */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                  aria-label="Delete transaction"
                  title="Delete transaction"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa giao dịch</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa giao dịch "{transaction.description}"? 
                    Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="sm:min-w-[100px]">Hủy</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-rose-500 hover:bg-rose-600 text-white sm:min-w-[100px]"
                  >
                    Xác nhận xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Time display */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs font-medium bg-secondary/80 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(transaction.createdAt, "HH:mm")}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">{format(transaction.createdAt, "EEEE, dd/MM/yyyy")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Split indicators */}
          <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
            {transaction.splits.map((split, index) => {
              if (split.amount === 0) return null;
              const user = getUserById(split.userId);
              if (!user) return null;

              const isPositive = split.amount > 0;
              
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full cursor-pointer transition-all",
                          isPositive 
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                            : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        )}
                      >
                        {isPositive ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        <span className="text-[10px] hidden xs:inline">{user.displayName.split(' ')[0]}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="p-2">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{user.displayName}</div>
                        <div className={cn(
                          "text-sm font-bold",
                          split.amount > 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {formatCurrency(split.amount)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expand/collapse button */}
      <button 
        className={cn(
          "w-full mt-3 flex items-center justify-center py-1 rounded-md text-xs font-medium",
          "bg-blue-50/50 hover:bg-blue-100 text-blue-700 transition-colors"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Thu gọn chi tiết
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            Xem chi tiết
          </>
        )}
      </button>

      {/* Expandable split details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 pt-3 border-t border-blue-200/50 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {transaction.splits.map((split, i) => {
              const splitUser = getUserById(split.userId);
              if (!splitUser) return null;
              
              const isPayerSplit = splitUser.id === payer.id;
              
              return (
                <motion.div 
                  key={`${splitUser.id}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    isPayerSplit 
                      ? "bg-blue-100/50 border border-blue-200" 
                      : split.amount > 0 
                        ? "bg-emerald-100/30 border border-emerald-200" 
                        : "bg-rose-100/30 border border-rose-200"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={splitUser.photoURL} />
                    <AvatarFallback className="text-xs">{splitUser.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex flex-col">
                    <span className="font-medium text-sm">
                      {splitUser.displayName}
                      {isPayerSplit && (
                        <Badge variant="secondary" className="ml-1 text-[9px] py-0 h-4 bg-blue-200 text-blue-800">
                          Trả tiền
                        </Badge>
                      )}
                    </span>
                    <span className={cn(
                      "text-sm font-bold",
                      split.amount > 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {formatCurrency(split.amount)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}