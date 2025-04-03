
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { Fund, Transaction } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TransactionRow } from "./TransactionRow";
import { ChevronDown } from "lucide-react";

interface TransactionListProps {
  fund: Fund;
}

export function TransactionList({ fund }: TransactionListProps) {
  const { transactions } = useApp();
  
  const fundTransactions = transactions
    .filter(transaction => transaction.fundId === fund.id)
    .sort((a, b) => b.createdAt - a.createdAt);

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

  const groupedTransactions = groupByDate(fundTransactions);

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div>Lịch sử giao dịch</div>
          <ChevronDown className="h-4 w-4" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="px-4 pb-4 space-y-6">
            {groupedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có giao dịch nào
              </div>
            ) : (
              groupedTransactions.map((group) => (
                <div key={group.date} className="space-y-2">
                  <div className="sticky top-0 bg-card z-10 py-2 font-medium text-sm text-muted-foreground">
                    {format(new Date(group.transactions[0].createdAt), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </div>
                  <div className="space-y-2">
                    {group.transactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
