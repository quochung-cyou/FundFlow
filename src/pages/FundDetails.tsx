
import { useApp } from "@/context/AppContext";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon, SearchIcon, ArrowUpDownIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Chatbot } from "@/components/chatbot/Chatbot";
import { CreateTransactionSheet } from "@/components/transactions/CreateTransactionSheet";
import { BalanceCard } from "@/components/balances/BalanceCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { FundSummaryChart } from "@/components/funds/FundSummaryChart";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FundDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { funds, selectedFund, setSelectedFund, calculateBalances, getUserById, currentUser, transactions } = useApp();
  
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [showAllMembers, setShowAllMembers] = useState(false);
  
  useEffect(() => {
    if (id && (!selectedFund || selectedFund.id !== id)) {
      const fund = funds.find((f) => f.id === id);
      if (fund) {
        setSelectedFund(fund);
      } else {
        navigate("/");
      }
    }
  }, [id, funds, selectedFund, setSelectedFund, navigate]);

  if (!selectedFund) return null;

  const balances = calculateBalances(selectedFund.id);
  const filteredTransactions = transactions.filter(t => t.fundId === selectedFund.id);
  
  // Calculate total fund balance
  const totalFundBalance = balances.reduce((sum, balance) => sum + balance.amount, 0);
  
  // Calculate transaction stats
  const transactionStats = {
    total: filteredTransactions.length,
    totalAmount: filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    avgAmount: filteredTransactions.length > 0 
      ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length 
      : 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
  };
  
  // Sort members by amount (highest to lowest)
  const sortedBalances = [...balances].sort((a, b) => b.amount - a.amount);
  
  // Show only first 6 members if there are many and not showing all
  const displayedMembers = showAllMembers ? sortedBalances : sortedBalances.slice(0, 6);
  
  return (
    <div className="container mx-auto max-w-6xl py-4 sm:py-6 px-4 sm:px-6">
      {/* Fund Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4">
          <div className="text-4xl sm:text-5xl">{selectedFund.icon}</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{selectedFund.name}</h1>
            <p className="text-muted-foreground">{selectedFund.description}</p>
          </div>
        </div>
        <CreateTransactionSheet fund={selectedFund}>
          <Button className="flex items-center gap-1 sm:self-start">
            <PlusIcon className="h-4 w-4" />
            <span>Thêm giao dịch</span>
          </Button>
        </CreateTransactionSheet>
      </div>
      
      {/* Main Content */}
      <div className="space-y-6">
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger value="summary" className="flex-1 sm:flex-auto">Tổng quan</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 sm:flex-auto">Giao dịch</TabsTrigger>
            <TabsTrigger value="chatbot" className="flex-1 sm:flex-auto">Chatbot</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Số dư quỹ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalFundBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(totalFundBalance)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Số giao dịch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{transactionStats.total}</div>
                </CardContent>
              </Card>
              
              <Card className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Tổng số tiền</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(transactionStats.totalAmount)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Trung bình / giao dịch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(transactionStats.avgAmount)}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Thống kê chi tiêu</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <FundSummaryChart fund={selectedFund} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Tình trạng thành viên</span>
                    {sortedBalances.length > 6 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAllMembers(!showAllMembers)}
                        className="h-8 px-2"
                      >
                        {showAllMembers ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">{showAllMembers ? "Ẩn bớt" : "Xem thêm"}</span>
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-3">
                    {displayedMembers.map((balance) => {
                      const user = getUserById(balance.userId);
                      if (!user) return null;
                      
                      return (
                        <div key={balance.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photoURL} alt={user.displayName} />
                              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className={cn(
                              "text-sm font-medium",
                              balance.userId === currentUser?.id ? "text-blue-600" : ""
                            )}>
                              {user.displayName}
                            </span>
                          </div>
                          <Badge variant={balance.amount >= 0 ? "outline" : "destructive"} className={cn(
                            balance.amount >= 0 ? "bg-emerald-50 text-emerald-700" : "",
                          )}>
                            {formatCurrency(balance.amount)}
                          </Badge>
                        </div>
                      );
                    })}
                    
                    {!showAllMembers && sortedBalances.length > 6 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-xs h-8 mt-2" 
                        onClick={() => setShowAllMembers(true)}
                      >
                        + Xem thêm {sortedBalances.length - 6} thành viên
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions" className="animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end">
              <div className="w-full sm:w-1/3">
                <label className="text-sm font-medium mb-1 block">Tìm kiếm giao dịch</label>
                <div className="relative">
                  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Mô tả, số tiền..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-1/3">
                <label className="text-sm font-medium mb-1 block">Khoảng thời gian</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Chọn khoảng thời gian"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange as any}
                      initialFocus
                      locale={vi}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
            
            <TransactionList fund={selectedFund} searchQuery={searchQuery} dateRange={dateRange} />
          </TabsContent>
          
          {/* Chatbot Tab */}
          <TabsContent value="chatbot" className="animate-fade-in">
            <Chatbot fund={selectedFund} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
