
import React from "react";
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useApp } from "@/context/AppContext";
import { Fund } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface FundSummaryChartProps {
  fund: Fund;
}

export function FundSummaryChart({ fund }: FundSummaryChartProps) {
  const { transactions, getUserById } = useApp();
  const [chartType, setChartType] = React.useState<"bar" | "pie">("bar");
  
  const fundTransactions = transactions.filter(t => t.fundId === fund.id);
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Function to prepare monthly transaction data
  const getMonthlyData = () => {
    // Get the last 3 months
    const currentDate = new Date();
    const months = [];
    
    for (let i = 2; i >= 0; i--) {
      const monthDate = subMonths(currentDate, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTransactions = fundTransactions.filter(t => 
        isWithinInterval(new Date(t.createdAt), { start: monthStart, end: monthEnd })
      );
      
      const totalSpent = monthTransactions.reduce((total, t) => total + t.amount, 0);
      
      months.push({
        name: format(monthDate, 'MMM yyyy', { locale: vi }),
        totalAmount: totalSpent,
        count: monthTransactions.length,
      });
    }
    
    return months;
  };
  
  // Function to prepare user contribution data
  const getUserContributionData = () => {
    const userContributions: Record<string, number> = {};
    
    fundTransactions.forEach(transaction => {
      if (!userContributions[transaction.paidBy]) {
        userContributions[transaction.paidBy] = 0;
      }
      userContributions[transaction.paidBy] += transaction.amount;
    });
    
    return Object.entries(userContributions).map(([userId, amount]) => {
      const user = getUserById(userId);
      return {
        name: user?.displayName || 'Unknown',
        value: amount,
        userId,
      };
    }).sort((a, b) => b.value - a.value);
  };
  
  const monthlyData = getMonthlyData();
  const userContributionData = getUserContributionData();
  
  // Colors matching shadcn UI vibe - soft pastels with good contrast
  const COLORS = [
    'hsl(221, 83%, 53%)',   // Blue
    'hsl(142, 76%, 36%)',   // Green
    'hsl(262, 80%, 50%)',   // Purple
    'hsl(346, 84%, 61%)',   // Red
    'hsl(31, 95%, 56%)',    // Orange
    'hsl(170, 57%, 50%)',   // Teal
  ];
  
  return (
    <div className="h-full flex flex-col">
      <Tabs value={chartType} onValueChange={(value) => setChartType(value as "bar" | "pie")} className="mb-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="bar">Chi tiêu theo tháng</TabsTrigger>
            <TabsTrigger value="pie">Đóng góp thành viên</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      
      <div className="flex-1 w-full h-full">
        {chartType === "bar" ? (
          <ChartContainer 
            config={{
              spent: { label: "Chi tiêu", color: "hsl(221, 83%, 53%)" },
              count: { label: "Số giao dịch", color: "hsl(142, 76%, 36%)" },
            }}
            className="w-full h-full"
          >
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(240 3.8% 46.1% / 0.3)' }}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(240 3.8% 46.1% / 0.3)' }}
                tickFormatter={(value) => formatCurrency(value)}
                width={80}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(240 3.8% 46.1% / 0.3)' }}
                width={30}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-md border bg-background shadow-md p-3 text-sm">
                        <p className="font-medium mb-1">{payload[0].payload.name}</p>
                        <p className="text-muted-foreground">Chi tiêu: <span className="font-medium text-foreground">{formatCurrency(payload[0].value as number)}</span></p>
                        <p className="text-muted-foreground">Số giao dịch: <span className="font-medium text-foreground">{payload[1].value}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'hsl(240 3.8% 46.1% / 0.05)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => <span className="text-xs font-medium">{value}</span>}
              />
              <Bar
                dataKey="totalAmount"
                name="Chi tiêu"
                fill="var(--color-spent)"
                yAxisId="left"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="count"
                name="Số giao dịch"
                fill="var(--color-count)"
                yAxisId="right"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer 
            config={{
              user1: { label: "Người dùng 1", color: COLORS[0] },
              user2: { label: "Người dùng 2", color: COLORS[1] },
            }}
            className="w-full h-full"
          >
            <PieChart margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={userContributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                label={({ name, value, percent }) => 
                  `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                paddingAngle={2}
              >
                {userContributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="hsl(240 3.8% 46.1% / 0.1)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const total = userContributionData.reduce((sum, item) => sum + item.value, 0);
                    
                    return (
                      <div className="rounded-md border bg-background shadow-md p-3 text-sm">
                        <p className="font-medium mb-1">{data.name}</p>
                        <p className="text-muted-foreground">Đóng góp: <span className="font-medium text-foreground">{formatCurrency(data.value)}</span></p>
                        <p className="text-muted-foreground">Tỷ lệ: <span className="font-medium text-foreground">{(data.value / total * 100).toFixed(1)}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                formatter={(value, entry, index) => {
                  const item = userContributionData[index];
                  return (
                    <span className="text-xs font-medium">
                      {value}: {formatCurrency(item.value)}
                    </span>
                  );
                }}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: "20px" }}
              />
            </PieChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
