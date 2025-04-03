
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from "@/context/AppContext";
import { Transaction } from "@/types";
import { format } from "date-fns";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TransactionRowProps {
  transaction: Transaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { getUserById } = useApp();
  const payer = getUserById(transaction.paidBy);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (!payer) return null;

  return (
    <div className="p-3 bg-secondary/50 rounded-lg animate-slide-in-up hover:bg-secondary transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={payer.photoURL} alt={payer.displayName} />
            <AvatarFallback>{payer.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{transaction.description}</div>
            <div className="text-xs text-muted-foreground">
              {payer.displayName} đã trả {formatCurrency(transaction.amount)}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-sm font-medium">
            {format(transaction.createdAt, "HH:mm")}
          </div>
          <div className="flex gap-1 items-center">
            {transaction.splits.map((split, index) => {
              if (split.amount === 0) return null;
              const user = getUserById(split.userId);
              if (!user) return null;
              
              return (
                <div
                  key={index}
                  className="text-xs flex items-center gap-1"
                  title={`${user.displayName}: ${formatCurrency(split.amount)}`}
                >
                  {split.amount > 0 ? (
                    <ArrowUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-rose-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
