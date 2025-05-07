import { Fund } from "@/types";
import { useApp } from "@/context/AppContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DailySpendingChart } from "./DailySpendingChart";
import { SummaryStatsCards } from "./SummaryStatsCards";

export function FundChartDashboard({ fund }: { fund: Fund }) {
  const { transactions } = useApp();
  const isMobile = useMediaQuery("(max-width: 640px)");
  
  // Filter transactions for this fund only
  const fundTransactions = transactions.filter(t => t.fundId === fund.id);
  const expenseTransactions = fundTransactions.filter(t => t.amount < 0);
  
  return (
    <div className="space-y-4 pb-6">
      <SummaryStatsCards 
        transactions={fundTransactions} 
        fund={fund}
      />
      
      <div className="mt-6 space-y-6">
        <DailySpendingChart 
          transactions={fundTransactions} 
          days={21}
        />
      </div>
    </div>
  );
}
