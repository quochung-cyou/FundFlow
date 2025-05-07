import { Transaction } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Format currency in VND
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", 
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format compact currency (without ₫ symbol for space constrained displays)
export const formatCompactCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount).replace("₫", "").trim();
};

// Get day name in Vietnamese
export const getDayName = (date: Date) => {
  return format(date, 'EEE', { locale: vi });
};



// Get expense by category
export const getExpensesByCategory = (transactions: Transaction[]) => {
  const categoryExpenses: Record<string, number> = {};
  
  // Filter negative transactions (expenses) and group by category
  transactions
    .filter(t => t.amount < 0)
    .forEach(t => {
      const category = t.category || "Khác";
      if (!categoryExpenses[category]) {
        categoryExpenses[category] = 0;
      }
      categoryExpenses[category] += Math.abs(t.amount);
    });
  
  // Convert to array and sort by value (highest first)
  return Object.entries(categoryExpenses)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

// COLORS for charts
export const COLORS = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
  "#9966FF", "#FF9F40", "#8AC148", "#EA5545",
  "#F46A9B", "#EF9B20", "#EDBF33", "#87BC45"
];
