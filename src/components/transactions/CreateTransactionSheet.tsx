
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { Fund } from "@/types";
import { useState } from "react";
import { PlusIcon, MinusIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CreateTransactionSheetProps {
  fund: Fund;
  children: React.ReactNode;
}

export function CreateTransactionSheet({ fund, children }: CreateTransactionSheetProps) {
  const { createTransaction, currentUser } = useApp();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [splits, setSplits] = useState<{ userId: string; amount: number }[]>([]);

  const handleResetForm = () => {
    setDescription("");
    setAmount("");
    setSplits([]);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      handleResetForm();
    } else {
      // Initialize splits with members
      if (fund.members.length > 0) {
        const initialSplits = fund.members.map(member => ({
          userId: member.id,
          amount: 0,
        }));
        setSplits(initialSplits);
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const distributeEvenly = () => {
    if (!amount || !currentUser) return;
    
    const numMembers = fund.members.length;
    const totalAmount = parseInt(amount);
    
    if (!totalAmount || numMembers <= 1) return;
    
    // Calculate share per member (excluding the payer)
    const payingMembers = numMembers - 1;
    const sharePerMember = Math.floor(totalAmount / payingMembers);
    
    const newSplits = fund.members.map(member => ({
      userId: member.id,
      amount: member.id === currentUser.id 
        ? totalAmount 
        : -sharePerMember
    }));
    
    setSplits(newSplits);
  };

  const handleUpdateSplit = (userId: string, value: number) => {
    setSplits(prev => 
      prev.map(split => 
        split.userId === userId 
          ? { ...split, amount: value } 
          : split
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !amount || parseInt(amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    
    // Validate that splits add up to the total amount
    const totalAmount = parseInt(amount);
    const totalSplits = splits.reduce((acc, curr) => acc + curr.amount, 0);
    
    if (totalSplits !== 0) {
      toast.error("Tổng số tiền chia không khớp với số tiền giao dịch");
      return;
    }
    
    createTransaction({
      fundId: fund.id,
      description: description || "Giao dịch mới",
      amount: totalAmount,
      paidBy: currentUser.id,
      splits
    });
    
    setIsOpen(false);
    handleResetForm();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Thêm giao dịch mới</SheetTitle>
          <SheetDescription>
            Thêm một khoản chi tiêu mới vào quỹ {fund.name}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              placeholder="Nhập mô tả giao dịch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền (VND)</Label>
            <Input
              id="amount"
              placeholder="Nhập số tiền"
              value={amount}
              onChange={handleAmountChange}
              inputMode="numeric"
              required
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Label>Chia tiền</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={distributeEvenly}
              disabled={!amount || parseInt(amount) <= 0}
            >
              Chia đều
            </Button>
          </div>
          
          <div className="space-y-3">
            {fund.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.photoURL} alt={member.displayName} />
                  <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-sm">
                  <div className="font-medium">{member.displayName}</div>
                </div>
                
                <div className="flex items-center rounded-md border">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-none"
                    onClick={() => {
                      const splitIndex = splits.findIndex(s => s.userId === member.id);
                      if (splitIndex >= 0) {
                        const currentAmount = splits[splitIndex].amount;
                        handleUpdateSplit(member.id, currentAmount - 10000);
                      }
                    }}
                  >
                    <MinusIcon className="h-3 w-3" />
                  </Button>
                  <div className={cn(
                    "w-24 text-center text-sm font-medium",
                    splits.find(s => s.userId === member.id)?.amount > 0 ? "text-emerald-500" : 
                    splits.find(s => s.userId === member.id)?.amount < 0 ? "text-rose-500" : ""
                  )}>
                    {formatCurrency(splits.find(s => s.userId === member.id)?.amount || 0)}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-none"
                    onClick={() => {
                      const splitIndex = splits.findIndex(s => s.userId === member.id);
                      if (splitIndex >= 0) {
                        const currentAmount = splits[splitIndex].amount;
                        handleUpdateSplit(member.id, currentAmount + 10000);
                      }
                    }}
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!amount || parseInt(amount) <= 0}>
              Thêm giao dịch
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
