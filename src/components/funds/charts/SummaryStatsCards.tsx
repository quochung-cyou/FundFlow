import React from "react";
import { Transaction, Fund } from "@/types";
import { 
  subDays, format
} from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  TrendingDown, CalendarDays, 
  Users
} from "lucide-react";
import { formatCompactCurrency, formatCurrency } from "./utils";
import { calculateTotalExpense } from "@/utils/transactionUtils";

export function SummaryStatsCards({
  transactions,
  fund
}: {
  transactions: Transaction[],
  fund: Fund
}) {
  const isMobile = window.innerWidth < 640;
  
  // Get last 30 days transactions
  const currentDate = new Date();
  const startDate = subDays(currentDate, 30);
  
  const recentTransactions = transactions.filter(t => 
    new Date(t.createdAt) >= startDate
  );
  
  // Calculate total expense using the new calculation method (sum up and divide by 2)
  const totalExpense = calculateTotalExpense(recentTransactions);
  
  // Calculate daily average expense
  const avgDailyExpense = totalExpense / 30;
  
  // Get transaction count for expenses
  const transactionCount = recentTransactions.length;
  
  // Get most active member (who created most transactions)
  const memberActivity: Record<string, number> = {};
  recentTransactions.forEach(t => {
    if (!memberActivity[t.paidBy]) {
      memberActivity[t.paidBy] = 0;
    }
    memberActivity[t.paidBy]++;
  });
  
  const mostActiveMemberId = Object.entries(memberActivity)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
    
  // Get member count
  const memberCount = fund.members.length;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {/* Expense Card */}
      <Card className="flex flex-col justify-between">
        <CardHeader className="p-2 pb-1 md:p-3 md:pb-2">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium md:text-sm">Chi tiêu</span>
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0 md:p-3 md:pt-0">
          <div className="text-sm md:text-base font-bold truncate">
            {formatCurrency(totalExpense)}
          </div>
          <div className="text-xs text-muted-foreground">
            TB {formatCompactCurrency(avgDailyExpense)}/ngày
          </div>
        </CardContent>
      </Card>
      
      {/* Date Range Card */}
      <Card className="flex flex-col justify-between">
        <CardHeader className="p-2 pb-1 md:p-3 md:pb-2">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium md:text-sm">Khoảng thời gian</span>
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0 md:p-3 md:pt-0">
          <div className="text-sm md:text-base font-bold truncate">
            30 ngày qua
          </div>
          <div className="text-xs text-muted-foreground">
            {format(startDate, 'dd/MM')} - {format(currentDate, 'dd/MM')}
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction Card */}
      <Card className="flex flex-col justify-between">
        <CardHeader className="p-2 pb-1 md:p-3 md:pb-2">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium md:text-sm">Giao dịch</span>
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0 md:p-3 md:pt-0">
          <div className="text-sm md:text-base font-bold truncate">
            {transactionCount} giao dịch
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {memberCount} thành viên
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
