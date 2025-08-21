import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/transactionUtils";
import { formatNumberWithSeparators } from "@/lib/utils";
import { PlusIcon, MinusIcon, CheckIcon, XIcon } from "lucide-react";

interface SplitAmountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (value: string) => void;
  userName: string;
}

export function SplitAmountPopup({
  isOpen,
  onClose,
  initialValue,
  onSave,
  userName,
}: SplitAmountPopupProps) {
  const [value, setValue] = useState(initialValue);
  const [isNegative, setIsNegative] = useState(initialValue.startsWith("-"));
  
  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue.startsWith("-") ? initialValue.substring(1) : initialValue);
      setIsNegative(initialValue.startsWith("-"));
    }
  }, [isOpen, initialValue]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const newValue = e.target.value.replace(/[^0-9]/g, "");
    setValue(newValue);
  };

  const toggleSign = () => {
    setIsNegative(!isNegative);
  };

  const handleSave = () => {
    onSave(isNegative ? `-${value}` : value);
    onClose();
  };

  const addAmount = (amount: number) => {
    const currentValue = parseInt(value) || 0;
    setValue((currentValue + amount).toString());
  };

  const addZeros = (count: number) => {
    setValue(value + "0".repeat(count));
  };

  const quickAmounts = [10000, 50000, 100000, 200000, 500000, 1000000];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Điều chỉnh số tiền cho {userName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isNegative ? "destructive" : "outline"}
              size="sm"
              onClick={() => setIsNegative(true)}
              className="flex-1"
            >
              <MinusIcon className="h-4 w-4 mr-1" />
              Trả
            </Button>
            <Button
              type="button"
              variant={!isNegative ? "default" : "outline"}
              size="sm"
              onClick={() => setIsNegative(false)}
              className="flex-1"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Nhận
            </Button>
          </div>
          
          <div className="relative">
            <Input
              value={value}
              onChange={handleValueChange}
              className={`h-14 text-right font-medium text-xl ${
                isNegative ? "text-rose-600 dark:text-rose-400" : ""
              }`}
              autoFocus
              inputMode="numeric"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <span className="font-medium">VND</span>
            </div>
          </div>
          
          {value && (
            <div className="text-sm text-muted-foreground p-3 bg-accent/30 rounded-md">
              <div className="font-medium">
                {isNegative ? "-" : ""}
                {formatNumberWithSeparators(parseInt(value) || 0)} VND
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Số tiền nhanh:</div>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue(amount.toString())}
                  className="text-xs"
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Thêm số 0:</div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addZeros(3)}
                className="flex-1"
              >
                + 000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addZeros(4)}
                className="flex-1"
              >
                + 0000
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addZeros(5)}
                className="flex-1"
              >
                + 00000
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Điều chỉnh:</div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAmount(-10000)}
                className="flex-1"
              >
                <MinusIcon className="h-3 w-3 mr-1" />
                10K
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAmount(10000)}
                className="flex-1"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                10K
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            <XIcon className="h-4 w-4 mr-1" />
            Hủy
          </Button>
          <Button type="button" onClick={handleSave}>
            <CheckIcon className="h-4 w-4 mr-1" />
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
