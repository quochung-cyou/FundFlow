
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
import { useState, useMemo, useRef, useEffect } from "react";
import { PlusIcon, MinusIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatNumberWithSeparators, numberToVietnameseText } from "@/lib/utils";

interface CreateTransactionSheetProps {
  fund: Fund;
  children: React.ReactNode;
  initialData?: {
    description?: string;
    amount?: string;
    paidBy?: string;
    splits?: { userId: string; amount: number }[];
    reasoning?: string; // Add reasoning field
  };
  openSheet?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateTransactionSheet({ fund, children, initialData, openSheet, onOpenChange }: CreateTransactionSheetProps) {
  const { createTransaction, currentUser, getUserById, loadUserFunds, funds } = useApp();
  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [isOpen, setIsOpen] = useState(openSheet || false);
  const [localFund, setLocalFund] = useState(fund);
  
  // Update localFund when fund prop changes
  useEffect(() => {
    setLocalFund(fund);
  }, [fund]);
  
  // Watch for changes to the openSheet prop
  useEffect(() => {
    console.log("openSheet changed to:", openSheet);
    
    // Always react to openSheet being true
    if (openSheet) {
      console.log("Opening sheet and applying data");
      setIsOpen(true);
      
      // Apply initialData when sheet is opened through prop
      if (initialData) {
        console.log("Applying initialData:", initialData);
        if (initialData.description) setDescription(initialData.description);
        if (initialData.amount) setAmount(initialData.amount);
        if (initialData.splits && initialData.splits.length > 0) {
          setSplits(initialData.splits);
        }
      }
      
      // Refresh fund data when sheet is opened
      if (currentUser) {
        loadUserFunds(currentUser.id).then(() => {
          // After refresh, update localFund with the most recent data from funds array
          const updatedFund = funds.find(f => f.id === fund.id);
          if (updatedFund) {
            console.log("Found updated fund data:", updatedFund);
            setLocalFund(updatedFund);
          }
        });
      }
    }
  }, [openSheet, initialData, currentUser, fund.id, funds, loadUserFunds]);
  const [splits, setSplits] = useState<{ userId: string; amount: number }[]>([]);
  const [showDescriptionPresets, setShowDescriptionPresets] = useState(false);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  
  // Convert member IDs to user objects
  const memberUsers = useMemo(() => {
    return (localFund.members || []).map(memberId => {
      const user = getUserById(memberId);
      return user || {
        id: memberId,
        displayName: 'User',
        email: '',
        photoURL: ''
      };
    });
  }, [localFund.members, getUserById]);

  const handleResetForm = () => {
    setDescription("");
    setAmount("");
    setSplits([]);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    // Call the onOpenChange prop if provided
    if (onOpenChange) {
      onOpenChange(open);
    }
    
    if (!open) {
      handleResetForm();
    } else {
      // Update description and amount from initialData if available
      if (initialData) {
        if (initialData.description) setDescription(initialData.description);
        if (initialData.amount) setAmount(initialData.amount);
      }

      // Initialize splits with initial data or members
      if (initialData?.splits && initialData.splits.length > 0) {
        setSplits(initialData.splits);
      } else if (localFund.members.length > 0) {
        const initialSplits = localFund.members.map(memberId => ({
          userId: memberId,
          amount: 0,
        }));
        setSplits(initialSplits);
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-digit characters
    value = value.replace(/[^\d]/g, '');
    
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setAmount(value);
      
      // Update splits with the new amount if they exist
      if (splits.length > 0 && value) {
        // Reset splits to zero when amount changes
        const resetSplits = splits.map(split => ({
          userId: split.userId,
          amount: 0
        }));
        setSplits(resetSplits);
      }
    }
  };
  
  // Add zeros to the end of the amount (e.g., for quick entry of thousands)
  const addZeros = (count: number) => {
    if (!amount) {
      setAmount('0'.repeat(count));
      return;
    }
    
    setAmount(prev => prev + '0'.repeat(count));
  };
  
  // Set a preset amount
  const setPresetAmount = (value: number) => {
    setAmount(value.toString());
  };
  
  // Format the amount as currency while user is typing
  const formatAmountForDisplay = (value: string) => {
    if (!value) return '';
    
    // Parse the numeric value
    const numericValue = parseInt(value);
    if (isNaN(numericValue)) return '';
    
    // Format with thousand separators
    return formatNumberWithSeparators(numericValue);
  };

  const distributeEvenly = () => {
    if (!amount || !currentUser) return;
    
    const numMembers = localFund.members.length;
    const totalAmount = parseInt(amount);
    
    if (!totalAmount || numMembers <= 1) return;
    
    // Calculate share per member (everyone gets an equal share)
    const sharePerMember = Math.floor(totalAmount / numMembers);
    
    // Calculate remainder to ensure the total is exact
    const remainder = totalAmount - (sharePerMember * numMembers);
    
    // Create new splits with:
    // 1. Everyone (including payer) owing their fair share (negative)
    // 2. The payer also getting credited for what they paid (positive)
    const newSplits = localFund.members.map((memberId, index) => {
      // Everyone has a negative share representing what they owe
      const share = -(sharePerMember + (index === 0 ? remainder : 0)); // Add remainder to first member
      
      if (memberId === currentUser.id) {
        // For the payer: they paid the total amount but also owe their share
        // So their net amount is: totalAmount + their share (which is negative)
        return {
          userId: memberId,
          amount: totalAmount + share
        };
      } else {
        // For everyone else: they just owe their share
        return {
          userId: memberId,
          amount: share
        };
      }
    });
    
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
    
    const totalAmount = parseInt(amount);
    
    // If splits are all zero, distribute evenly first
    const allZero = splits.every(split => split.amount === 0);
    if (allZero) {
      distributeEvenly();
      toast.info("Đã tự động chia đều số tiền");
      return; // Return to let the user review the distribution before submitting
    }
    
    // Validate that the positive amounts match the transaction amount

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
  
  // Format large numbers with proper thousand separators
  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Remove excessive logging

  return (
    <Sheet 
      open={isOpen} 
      onOpenChange={handleSheetOpenChange}
      defaultOpen={false}
    >
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
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Mô tả</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowDescriptionPresets(!showDescriptionPresets)}
              >
                Gợi ý
              </Button>
            </div>
            <div className="relative">
              <Input
                id="description"
                placeholder="Nhập mô tả giao dịch"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                ref={descriptionInputRef}
              />
              
              {/* Description presets */}
              {showDescriptionPresets && (
                <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg p-2 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Chọn mô tả phổ biến:</div>
                  {[
                    "Trả nợ",
                    "Chia tiền ăn trưa",
                    "Chia tiền ăn sáng",
                    "Chia tiền ăn tối",
                    "Tiền xăng xe",
                    "Tiền taxi/grab",
                    "Tiền cà phê",
                    "Tiền đi chợ",
                    "Tiền điện nước",
                    "Tiền thuê nhà",
                    "Tiền mua sắm",
                    "Tiền giải trí"
                  ].map((preset) => (
                    <div 
                      key={preset} 
                      className="p-2 text-sm hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => {
                        setDescription(preset);
                        setShowDescriptionPresets(false);
                        descriptionInputRef.current?.focus();
                      }}
                    >
                      {preset}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
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
                <div className="font-medium">
                  {formatNumberWithSeparators(amount)} VND
                </div>
                <div className="text-xs italic">
                  {numberToVietnameseText(amount)}
                </div>
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
            {memberUsers.map((member) => (
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
                    disabled={!amount || parseInt(amount) <= 0}
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
                    disabled={!amount || parseInt(amount) <= 0}
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
          
          {/* Display AI reasoning if available */}
          {initialData?.reasoning && (
            <div className="my-4 p-3 bg-muted/50 border rounded-md">
              <div className="text-sm font-medium mb-1">Gợi ý từ AI:</div>
              <div className="text-sm text-muted-foreground">{initialData.reasoning}</div>
            </div>
          )}

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
