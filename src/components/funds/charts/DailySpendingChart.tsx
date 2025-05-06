import React from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Transaction } from "@/types";
import { 
  format, startOfDay, endOfDay, eachDayOfInterval, subDays, 
  isWithinInterval
} from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { formatCompactCurrency, formatCurrency } from "./utils";

export function DailySpendingChart({ 
  transactions, 
  days = 30
}: { 
  transactions: Transaction[], 
  days?: number
}) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const currentDate = new Date();
  const startDate = subDays(currentDate, days - 1);
  
  // Generate array of all days in the interval
  const daysArray = eachDayOfInterval({
    start: startDate,
    end: currentDate
  });
  
  // Create a map to store expenses for each day
  const dailyExpenseMap: Record<string, { expense: number, count: number }> = {};
  
  // Initialize all days in range with zero values
  daysArray.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    dailyExpenseMap[dateKey] = { expense: 0, count: 0 };
  });
  
  // Process transactions to populate the map
  transactions.forEach(transaction => {
    // Use date or createdAt, and extract only the date part
    const transactionDate = transaction.date ? new Date(transaction.date) : new Date(transaction.createdAt);
    const dateKey = format(transactionDate, 'yyyy-MM-dd');
    
    // Only process if within our date range and is an expense (negative amount)
    if (dailyExpenseMap[dateKey]) {
      dailyExpenseMap[dateKey].expense += Math.abs(transaction.amount)/2;
      dailyExpenseMap[dateKey].count += 1;
    }
  });
  
  // Convert the map to the array format needed for the chart
  const dailyData = daysArray.map(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayData = dailyExpenseMap[dateKey] || { expense: 0, count: 0 };
    
    return {
      date: day,
      dayName: format(day, 'EEE', { locale: vi }),
      dayDate: format(day, 'dd/MM'),
      fullDate: format(day, 'dd/MM/yyyy'),
      expense: dayData.expense,
      count: dayData.count,
    };
  });

  // Find the max expense day
  const maxExpenseDay = [...dailyData].sort((a, b) => b.expense - a.expense)[0];
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base sm:text-lg">Chi tiêu theo ngày</CardTitle>
          {maxExpenseDay && maxExpenseDay.expense > 0 && (
            <div className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
              Ngày cao nhất: {maxExpenseDay.dayDate} ({formatCompactCurrency(maxExpenseDay.expense)})
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4 pt-2">
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyData}
              margin={isMobile ? 
                { top: 10, right: 10, left: 0, bottom: 20 } : 
                { top: 10, right: 30, left: 10, bottom: 20 }
              }
            >
              <defs>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(346, 84%, 61%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(346, 84%, 61%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey={isMobile ? "dayDate" : "fullDate"}
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(240 3.8% 46.1% / 0.3)' }}
                interval={isMobile ? 4 : 2}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={50}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(240 3.8% 46.1% / 0.3)' }}
                tickFormatter={(value) => 
                  isMobile ? formatCompactCurrency(value) : formatCompactCurrency(value)
                }
                width={isMobile ? 60 : 80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{data.fullDate}</span>
                            <span className="text-xs text-muted-foreground">{data.dayName}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {formatCurrency(data.expense)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {data.count} giao dịch
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="hsl(346, 84%, 61%)" 
                fillOpacity={1}
                fill="url(#expense)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
