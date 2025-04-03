
import { useApp } from "@/context/AppContext";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Chatbot } from "@/components/chatbot/Chatbot";
import { CreateTransactionSheet } from "@/components/transactions/CreateTransactionSheet";
import { BalanceCard } from "@/components/balances/BalanceCard";

export default function FundDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { funds, selectedFund, setSelectedFund, calculateBalances, getUserById, currentUser } = useApp();

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{selectedFund.icon}</div>
          <div>
            <h1 className="text-3xl font-bold">{selectedFund.name}</h1>
            <p className="text-muted-foreground">{selectedFund.description}</p>
          </div>
        </div>
        <CreateTransactionSheet fund={selectedFund}>
          <Button className="flex items-center gap-1">
            <PlusIcon className="h-4 w-4" />
            <span>Thêm giao dịch</span>
          </Button>
        </CreateTransactionSheet>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Thành viên</h2>
        <div className="flex flex-wrap gap-4">
          {selectedFund.members.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-1">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.photoURL} alt={member.displayName} />
                <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-sm">{member.displayName}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tình trạng quỹ</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {balances.map((balance) => {
            const user = getUserById(balance.userId);
            if (!user) return null;
            
            return (
              <BalanceCard
                key={balance.userId}
                user={user}
                amount={balance.amount}
                isCurrentUser={currentUser?.id === user.id}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TransactionList fund={selectedFund} />
        <Chatbot fund={selectedFund} />
      </div>
    </div>
  );
}
