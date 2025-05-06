import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Fund, User } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumberWithSeparators, numberToVietnameseText } from "@/lib/utils";
import { toast } from "sonner";

interface ReturnMoneyButtonProps {
  fund: Fund;
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}

export function ReturnMoneyButton({ fund, trigger }: ReturnMoneyButtonProps) {
  const { createTransaction, currentUser, getUserById } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");

  // Convert member IDs to user objects
  const memberUsers = fund.members
    .map((memberId) => getUserById(memberId))
    .filter((user): user is User => user !== undefined && user.id !== currentUser?.id);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove all non-digit characters
    value = value.replace(/[^\d]/g, "");
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const setPresetAmount = (value: number) => {
    setAmount(value.toString());
  };

  const addZeros = (count: number) => {
    if (!amount) {
      setAmount("0".repeat(count));
      return;
    }
    setAmount((prev) => prev + "0".repeat(count));
  };

  const handleSubmit = async () => {
    if (!currentUser || !selectedUser || !amount || parseInt(amount) <= 0) {
      toast.error("Vui lòng chọn người nhận và nhập số tiền hợp lệ");
      return;
    }

    const totalAmount = parseInt(amount);

    // Create a transaction where:
    // 1. The selected user gets +totalAmount (they're receiving money)
    // 2. The current user gets -totalAmount (they're paying money)
    const splits = [
      {
        userId: selectedUser.id,
        amount: -totalAmount, // Positive amount (receiving money)
      },
      {
        userId: currentUser.id,
        amount: +totalAmount, // Negative amount (paying money)
      },
    ];

    try {
      await createTransaction({
        fundId: fund.id,
        description: `Trả tiền cho ${selectedUser.displayName}`,
        amount: totalAmount,
        paidBy: currentUser.id,
        splits,
      });

      toast.success(`Đã trả ${formatNumberWithSeparators(amount)} VND cho ${selectedUser.displayName}`);
      setIsOpen(false);
      setSelectedUser(null);
      setAmount("");
    } catch (error) {
      toast.error("Không thể tạo giao dịch");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Trả tiền
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-2 border-b">
          <SheetHeader>
            <SheetTitle>Trả tiền</SheetTitle>
            <SheetDescription>Trả tiền cho thành viên trong quỹ {fund.name}</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Select user section */}
          <div className="space-y-2">
            <Label>Chọn người nhận</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {memberUsers.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant={selectedUser?.id === user.id ? "default" : "outline"}
                  className="flex items-center gap-2 h-auto py-2 justify-start"
                  onClick={() => setSelectedUser(user)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate">{user.displayName}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Amount input section */}
          {selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền</Label>
              <div className="relative">
                <Input
                  id="amount"
                  placeholder="Nhập số tiền"
                  value={amount}
                  onChange={handleAmountChange}
                  inputMode="numeric"
                  required
                  className="pl-12 h-12 text-right font-medium text-lg"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <span className="font-medium">VND</span>
                </div>
              </div>

              {/* Amount display in formatted text */}
              {amount && parseInt(amount) > 0 && (
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  <div className="font-medium">{formatNumberWithSeparators(amount)} VND</div>
                  <div className="text-xs italic">{numberToVietnameseText(amount)}</div>
                </div>
              )}

              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAmount(10000)}
                  className="text-xs h-8"
                >
                  10.000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAmount(50000)}
                  className="text-xs h-8"
                >
                  50.000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAmount(100000)}
                  className="text-xs h-8"
                >
                  100.000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAmount(200000)}
                  className="text-xs h-8"
                >
                  200.000
                </Button>
              </div>

              {/* Additional preset amounts */}
              <div className="grid grid-cols-4 gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAmount(500000)}
                  className="text-xs h-8"
                >
                  500.000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAmount(1000000)}
                  className="text-xs h-8"
                >
                  1 triệu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAmount(2000000)}
                  className="text-xs h-8"
                >
                  2 triệu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetAmount(5000000)}
                  className="text-xs h-8"
                >
                  5 triệu
                </Button>
              </div>

              {/* Quick zeros buttons */}
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addZeros(3)}
                  className="flex-1 text-xs h-8"
                >
                  + 000
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addZeros(4)}
                  className="flex-1 text-xs h-8"
                >
                  + 0000
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addZeros(5)}
                  className="flex-1 text-xs h-8"
                >
                  + 00000
                </Button>
              </div>
            </div>
          )}

          {/* Transaction summary */}
          {selectedUser && amount && parseInt(amount) > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 border">
              <h3 className="font-medium">Tóm tắt giao dịch:</h3>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedUser.photoURL} alt={selectedUser.displayName} />
                    <AvatarFallback>{selectedUser.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{selectedUser.displayName}</span>
                </div>
                <span className="text-rose-500 font-medium">-{formatNumberWithSeparators(amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={currentUser?.photoURL} alt={currentUser?.displayName} />
                    <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{currentUser?.displayName}</span>
                </div>
                <span className="text-emerald-500 font-medium">+{formatNumberWithSeparators(amount)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t mt-auto">
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedUser || !amount || parseInt(amount) <= 0}
            >
              Trả tiền
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
