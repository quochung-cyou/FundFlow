
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
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
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
      
      <div className="flex-1">
        {chartType === "bar" ? (
          <ChartContainer 
            config={{
              spent: { label: "Chi tiêu", color: "#0088FE" },
              count: { label: "Số giao dịch", color: "#00C49F" },
            }}
            className="h-full"
          >
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg shadow-md p-3 text-sm">
                        <p className="font-medium">{payload[0].payload.name}</p>
                        <p>Chi tiêu: {formatCurrency(payload[0].value as number)}</p>
                        <p>Số giao dịch: {payload[1].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar
                dataKey="totalAmount"
                name="Chi tiêu"
                fill="var(--color-spent)"
                yAxisId="left"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="count"
                name="Số giao dịch"
                fill="var(--color-count)"
                yAxisId="right"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer 
            config={{
              user1: { label: "Người dùng 1", color: "#0088FE" },
              user2: { label: "Người dùng 2", color: "#00C49F" },
            }}
            className="h-full"
          >
            <PieChart>
              <Pie
                data={userContributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                labelLine={false}
              >
                {userContributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-md p-3 text-sm">
                        <p className="font-medium">{data.name}</p>
                        <p>Đóng góp: {formatCurrency(data.value)}</p>
                        <p>Tỷ lệ: {(data.value / userContributionData.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
