
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from "@/context/AppContext";
import { Transaction } from "@/types";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, User } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TransactionRowProps {
  transaction: Transaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { getUserById } = useApp();
  const payer = getUserById(transaction.paidBy);
  const [isHovered, setIsHovered] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (!payer) return null;

  return (
    <motion.div 
      className={cn(
        "p-3 rounded-lg transition-all duration-300", 
        isHovered ? "bg-blue-50" : "bg-secondary/50 hover:bg-blue-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -10, opacity: 0 }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className={cn(
              "h-10 w-10 transition-all duration-300 bg-gradient-to-br",
              isHovered ? "from-blue-500 to-blue-600 ring-2 ring-blue-200" : "from-gray-200 to-gray-300"
            )}>
              <AvatarImage src={payer.photoURL} alt={payer.displayName} />
              <AvatarFallback>
                <User className="h-5 w-5 text-white" />
              </AvatarFallback>
            </Avatar>
            <motion.div 
              animate={{
                scale: isHovered ? 1.2 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 
                flex items-center justify-center text-[10px] text-white font-bold border-2 border-white"
            >
              {transaction.splits.length}
            </motion.div>
          </div>
          <div>
            <div className="font-medium text-sm sm:text-base line-clamp-1 transition-colors duration-300">
              {transaction.description}
            </div>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
              <span className="font-medium text-blue-600">{payer.displayName}</span> 
              <span>đã trả</span> 
              <Badge variant="outline" className={cn(
                "text-[10px] py-0 h-5 transition-colors duration-300",
                isHovered ? "bg-blue-100 text-blue-700" : ""
              )}>
                {formatCurrency(transaction.amount)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs font-medium bg-secondary/80 px-2 py-1 rounded-full">
            {format(transaction.createdAt, "HH:mm")}
          </div>
          
          <motion.div
            layout
            className={cn(
              "flex gap-1 items-center mt-1",
              isHovered ? "opacity-100" : "opacity-70" 
            )}
          >
            {transaction.splits.map((split, index) => {
              if (split.amount === 0) return null;
              const user = getUserById(split.userId);
              if (!user) return null;

              const isPositive = split.amount > 0;
              
              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className={cn(
                    "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full",
                    isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}
                  title={`${user.displayName}: ${formatCurrency(split.amount)}`}
                >
                  {isPositive ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline text-[10px]">{user.displayName.split(' ')[0]}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {isHovered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 pt-2 border-t border-border/30 grid grid-cols-2 sm:grid-cols-3 gap-2"
        >
          {transaction.splits.map((split, i) => {
            const splitUser = getUserById(split.userId);
            if (!splitUser) return null;
            
            return (
              <motion.div 
                key={`${splitUser.id}-${i}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 text-xs"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={splitUser.photoURL} />
                  <AvatarFallback>{splitUser.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col">
                  <span className="font-medium">{splitUser.displayName}</span>
                  <span className={cn(
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
    </motion.div>
  );
}
