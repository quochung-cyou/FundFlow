import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/transactionUtils";
import { PlusIcon, MinusIcon } from "lucide-react";
import { SplitAmountPopup } from "../SplitAmountPopup";
import { toast } from "sonner";

interface User {
  id: string;
  displayName: string;
  photoURL?: string;
}

interface MemberSplitItemProps {
  member: User;
  amount: number;
  isAmountValid: boolean;
  handleUpdateSplit: (userId: string, amount: number) => void;
}

export function MemberSplitItem({
  member,
  amount,
  isAmountValid,
  handleUpdateSplit
}: MemberSplitItemProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleSaveAmount = (newValue: string) => {
    handleUpdateSplit(member.id, parseInt(newValue) || 0);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/20 border border-border/20">
      <Avatar className="h-10 w-10">
        <AvatarImage src={member.photoURL} alt={member.displayName} />
        <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 text-sm">
        <div className="font-medium text-base">{member.displayName}</div>
      </div>
      
      <div className="flex items-center rounded-md border">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-none"
          disabled={!isAmountValid}
          onClick={() => {
            if (!isAmountValid) {
              toast.error("Vui lòng nhập số tiền tổng trước khi chỉnh sửa", {
                position: "top-center",
                duration: 3000,
              });
              return;
            }
            handleUpdateSplit(member.id, amount - 10000);
          }}
        >
          <MinusIcon className="h-3 w-3" />
        </Button>
        <div className="w-24 relative">
          <div 
            className={cn(
              "w-24 text-center text-sm font-medium h-8 flex items-center justify-center cursor-pointer hover:bg-accent/50 rounded-md",
              amount > 0 ? "text-emerald-500" : 
              amount < 0 ? "text-rose-500" : ""
            )}
            onClick={() => {
              if (!isAmountValid) {
                toast.error("Vui lòng nhập số tiền tổng trước khi chỉnh sửa", {
                  position: "top-center",
                  duration: 3000,
                });
                return;
              }
              setIsPopupOpen(true);
            }}
          >
            {formatCurrency(amount)}
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-none"
          disabled={!isAmountValid}
          onClick={() => {
            if (!isAmountValid) {
              toast.error("Vui lòng nhập số tiền tổng trước khi chỉnh sửa", {
                position: "top-center",
                duration: 3000,
              });
              return;
            }
            handleUpdateSplit(member.id, amount + 10000);
          }}
        >
          <PlusIcon className="h-3 w-3" />
        </Button>
      </div>
      
      <SplitAmountPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        initialValue={amount.toString()}
        onSave={handleSaveAmount}
        userName={member.displayName}
      />
    </div>
  );
}
