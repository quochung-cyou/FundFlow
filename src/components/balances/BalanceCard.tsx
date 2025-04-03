
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  user: User;
  amount: number;
  isCurrentUser: boolean;
}

export function BalanceCard({ user, amount, isCurrentUser }: BalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md animate-fade-in",
      isCurrentUser ? "border-blue-200 bg-blue-50" : ""
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.photoURL} alt={user.displayName} />
            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-base">
            {user.displayName}
            {isCurrentUser && <span className="text-xs ml-2 text-blue-500">(Bạn)</span>}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-xl font-bold",
          amount > 0 ? "text-emerald-500" : amount < 0 ? "text-rose-500" : "text-gray-500"
        )}>
          {formatCurrency(amount)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {amount > 0 ? "Được nhận" : amount < 0 ? "Cần trả" : "Đã cân bằng"}
        </div>
      </CardContent>
    </Card>
  );
}
