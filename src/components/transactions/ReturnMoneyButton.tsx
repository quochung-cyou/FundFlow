import { useState, useEffect } from "react";
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
import { ArrowDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QRCodeDisplay } from "@/components/profile/QRCodeDisplay";
import { BankDeepLinkButton } from "@/components/profile/BankDeepLinkButton";

interface ReturnMoneyButtonProps {
  fund: Fund;
  trigger?: React.ReactNode;
  fundBalanceData?: { userId: string; amount: number }[];
}

export function ReturnMoneyButton({ fund, trigger, fundBalanceData }: Readonly<ReturnMoneyButtonProps>) {
  const { createTransaction, currentUser, getUserById, calculateBalances } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [balances, setBalances] = useState<{ userId: string; amount: number }[]>([]);
  const [currentUserBalance, setCurrentUserBalance] = useState<number>(0);
  const [showQRCode, setShowQRCode] = useState(false);

  // Convert member IDs to user objects (synchronously now that users are preloaded)
  const memberUsers = fund.members
    .map((memberId) => getUserById(memberId))
    .filter((user): user is User => user && user.id !== currentUser?.id && user.displayName !== `User ${user.id.substring(0, 4)}`);

  // Get balances for the current fund
  useEffect(() => {
    const fundBalances = fundBalanceData || calculateBalances(fund.id);
    setBalances(fundBalances);
    
    // Find current user's balance
    if (currentUser) {
      const userBalance = fundBalances.find(b => b.userId === currentUser.id);
      setCurrentUserBalance(userBalance?.amount || 0);
    }
  }, [fund.id, currentUser, calculateBalances, fundBalanceData]);

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

  // Set the amount to the absolute value of the current user's negative balance
  const setNegativeBalanceAmount = () => {
    if (currentUserBalance < 0) {
      setAmount(Math.abs(currentUserBalance).toString());
    } else {
      toast.info("Bạn không có số dư âm cần thanh toán");
    }
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
      console.error("Error creating transaction:", error);
      toast.error("Không thể tạo giao dịch");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
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
          {/* Current user balance */}
          {currentUser && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName} />
                    <AvatarFallback>{currentUser.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{currentUser.displayName}</div>
                    <div className="text-sm text-muted-foreground">Số dư hiện tại</div>
                  </div>
                </div>
                <Badge variant={currentUserBalance >= 0 ? "outline" : "destructive"} className="ml-auto text-sm font-medium">
                  {formatNumberWithSeparators(Math.abs(currentUserBalance))} VND
                  {currentUserBalance >= 0 ? " (dương)" : " (âm)"}
                </Badge>
              </div>
              
              {currentUserBalance < 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 bg-muted/50 border-dashed"
                  onClick={setNegativeBalanceAmount}
                >
                  <ArrowDownIcon className="h-3.5 w-3.5 mr-1.5" />
                  Trả toàn bộ số dư âm
                </Button>
              )}
            </div>
          )}

          {/* Select user section */}
          <div className="space-y-2">
            <Label>Chọn người nhận</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {memberUsers.map((user) => {
                // Find this user's balance
                const userBalance = balances.find(b => b.userId === user.id);
                const balanceAmount = userBalance?.amount || 0;
                
                return (
                  <Button
                    key={user.id}
                    type="button"
                    variant={selectedUser?.id === user.id ? "default" : "outline"}
                    className="flex items-center gap-2 h-auto py-2 justify-start relative"  
                    onClick={() => setSelectedUser(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-medium truncate">{user.displayName}</span>
                      <span className={`text-xs ${balanceAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumberWithSeparators(Math.abs(balanceAmount))} {balanceAmount >= 0 ? '+' : '-'}
                      </span>
                    </div>
                    {user.bankAccount && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white">₫</span>
                      </div>
                    )}
                  </Button>
                );
              })}
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
            <div className="bg-muted/50 p-4 rounded-lg space-y-3 border">
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

              {/* Bank Account Information Display */}
              {selectedUser.bankAccount && (
                <div className="pt-3 border-t space-y-3">
                  <h4 className="font-medium text-sm">Thông tin chuyển khoản:</h4>
                  <div className="bg-white p-3 rounded-lg border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ngân hàng:</span>
                      <span className="text-sm">{selectedUser.bankAccount.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Số TK:</span>
                      <span className="text-sm font-mono">{selectedUser.bankAccount.accountNumber}</span>
                    </div>
                    {selectedUser.bankAccount.accountName && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Tên TK:</span>
                        <span className="text-sm">{selectedUser.bankAccount.accountName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code button if user has bank account */}
              {selectedUser.bankAccount && (
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => setShowQRCode(true)}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <rect x="7" y="7" width="3" height="3"/>
                      <rect x="14" y="7" width="3" height="3"/>
                      <rect x="7" y="14" width="3" height="3"/>
                      <path d="m14 14 3 3"/>
                      <path d="m14 17 3-3"/>
                    </svg>
                    Xem mã QR chuyển tiền
                  </Button>

                  {/* Bank Deep Link Button */}
                  <BankDeepLinkButton />
                </div>
              )}
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

      {/* QR Code Dialog */}
      {selectedUser?.bankAccount && (
        <QRCodeDisplay
          user={selectedUser}
          amount={parseInt(amount) || undefined}
          description={`Trả tiền cho ${selectedUser.displayName}`}
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </Sheet>
  );
}
