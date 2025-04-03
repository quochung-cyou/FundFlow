
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { SendIcon } from "lucide-react";
import { Fund } from "@/types";

interface ChatbotProps {
  fund: Fund;
}

export function Chatbot({ fund }: ChatbotProps) {
  const [input, setInput] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dialogData, setDialogData] = useState<{
    payer: string | null;
    totalAmount: number | null;
    splits: { person: string; amount: number }[];
  }>({
    payer: null,
    totalAmount: null,
    splits: [],
  });

  const { createTransaction } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setProcessing(true);
    
    // Wait a bit to simulate processing
    setTimeout(() => {
      // Simple pattern matching for "X trả Y, chia A-B-C cho D, E, F"
      const regex = /(.+) trả (\d+)k?,? chia (.+) cho (.+)/i;
      const match = input.match(regex);
      
      if (match) {
        const [_, payer, amountStr, splitStr, peopleStr] = match;
        const amount = parseInt(amountStr.replace(/k/i, "000"));
        const splits = splitStr.split("-").map(s => parseInt(s.trim()));
        const people = peopleStr.split(",").map(p => p.trim());
        
        if (splits.length === people.length) {
          setDialogData({
            payer,
            totalAmount: amount,
            splits: people.map((person, index) => ({
              person,
              amount: splits[index] * 1000,
            })),
          });
          
          setShowDialog(true);
        }
      }
      
      setProcessing(false);
      setInput("");
    }, 800);
  };

  const handleConfirmTransaction = () => {
    if (!dialogData.payer || !dialogData.totalAmount) return;
    
    // Find payer user
    const payerUser = fund.members.find(
      (member) => member.displayName.toLowerCase().includes(dialogData.payer!.toLowerCase())
    );
    
    if (!payerUser) return;
    
    // Create splits
    const transactionSplits = fund.members.map((member) => {
      // If member is payer
      if (member.id === payerUser.id) {
        return { userId: member.id, amount: dialogData.totalAmount! };
      }
      
      // Check if member is in splits
      const split = dialogData.splits.find((s) =>
        member.displayName.toLowerCase().includes(s.person.toLowerCase())
      );
      
      return { 
        userId: member.id, 
        amount: split ? -split.amount : 0 
      };
    });
    
    // Create transaction
    createTransaction({
      fundId: fund.id,
      description: input,
      amount: dialogData.totalAmount,
      paidBy: payerUser.id,
      splits: transactionSplits,
    });
    
    setShowDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="py-3 px-4 border-b">
          <div className="text-lg font-medium">Chatbot</div>
        </CardHeader>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg max-w-[80%] animate-fade-in">
              <div className="text-sm">
                Chào bạn! Tôi có thể giúp bạn chia tiền cho các thành viên trong quỹ.
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg max-w-[80%] animate-fade-in">
              <div className="text-sm">
                Hãy nhập theo cú pháp: "X trả 200k, chia 50-50-100 cho B, C, D"
              </div>
            </div>
          </div>
        </ScrollArea>
        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSubmit} className="w-full flex gap-2">
            <Input
              placeholder="Nhập giao dịch..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={processing}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || processing}>
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận giao dịch</DialogTitle>
            <DialogDescription>
              Kiểm tra thông tin giao dịch bên dưới và xác nhận.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center py-2 border-b">
              <div>Người trả</div>
              <div className="font-medium">{dialogData.payer}</div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div>Tổng cộng</div>
              <div className="font-medium">
                {dialogData.totalAmount && formatCurrency(dialogData.totalAmount)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Chi tiết chia tiền:</div>
              {dialogData.splits.map((split, index) => (
                <div key={index} className="flex justify-between items-center py-1 text-sm">
                  <div>{split.person}</div>
                  <div className="text-rose-500">{formatCurrency(-split.amount)}</div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmTransaction}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
