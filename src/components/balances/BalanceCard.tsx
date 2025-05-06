
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Banknote } from "lucide-react";

interface BalanceCardProps {
  user: User;
  amount: number;
  isCurrentUser: boolean;
  index?: number;
}

export function BalanceCard({ user, amount, isCurrentUser, index = 0 }: BalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Determine color scheme based on amount
  const getColorScheme = () => {
    if (amount > 0) return "emerald";
    if (amount < 0) return "rose";
    return "gray";
  };

  const colorScheme = getColorScheme();
  const colorClasses = {
    emerald: "bg-emerald-50 border-emerald-200 shadow-emerald-100",
    rose: "bg-rose-50 border-rose-200 shadow-rose-100",
    gray: "bg-gray-50 border-gray-200 shadow-gray-100",
    current: "bg-blue-50 border-blue-200 shadow-blue-100"
  };

  const textClasses = {
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    gray: "text-gray-600",
  };

  const iconClasses = {
    emerald: "text-emerald-500 bg-emerald-100",
    rose: "text-rose-500 bg-rose-100",
    gray: "text-gray-500 bg-gray-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.4,
        type: "spring",
        stiffness: 100
      }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md group",
        isCurrentUser ? colorClasses.current : colorClasses[colorScheme]
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-white">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback className={cn(
                  "font-bold",
                  isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200"
                )}>
                  {user.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isCurrentUser && (
                <span className="absolute -right-1 -bottom-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-[8px] text-white font-bold"
                  >
                    ✓
                  </motion.span>
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-base flex flex-col sm:flex-row sm:items-center">
                <span>{user.displayName}</span>
                {isCurrentUser && (
                  <span className="text-xs text-blue-500 sm:ml-2">(Bạn)</span>
                )}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              iconClasses[colorScheme]
            )}>
              {amount > 0 ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : amount < 0 ? (
                <ArrowDownRight className="h-5 w-5" />
              ) : (
                <Banknote className="h-5 w-5" />
              )}
            </div>
            
            <div className="flex-1">
              <div className={cn(
                "text-xl font-bold",
                textClasses[colorScheme]
              )}>
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index * 0.1) + 0.3, duration: 0.3 }}
                >
                  {formatCurrency(amount)}
                </motion.span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {amount > 0 ? (
                  "Được nhận"
                ) : amount < 0 ? (
                  "Cần trả"
                ) : (
                  "Đã cân bằng"
                )}
              </div>
            </div>
          </div>
          
          <motion.div 
            className={cn(
              "w-full h-2 rounded-full mt-3 overflow-hidden",
              amount > 0 ? "bg-emerald-100" : amount < 0 ? "bg-rose-100" : "bg-gray-100"
            )}
          >
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.abs(amount) / 1000 * 100, 100)}%` }}
              transition={{ delay: (index * 0.1) + 0.5, duration: 0.7, type: "spring" }}
              className={cn(
                "h-full",
                amount > 0 ? "bg-emerald-500" : amount < 0 ? "bg-rose-500" : "bg-gray-500"
              )}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
