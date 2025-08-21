import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SplitType } from "@/types";
import { MemberSplit } from "@/hooks/useTransactionForm";
import { formatAmountForDisplay } from "@/utils/transactionUtils";
import { UserWithProfile } from "@/types";

export interface MemberSplitListProps {
  splits: MemberSplit[];
  memberUsers: UserWithProfile[];
  splitType: SplitType;
  totalAmount: string;
  onSplitChange: (memberId: string, amount: number) => void;
  onToggleMember: (memberId: string, isActive: boolean) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * MemberSplitList component for displaying and editing member splits
 * Features:
 * - Toggle members in/out of the split
 * - Edit individual split amounts
 * - Display percentage or amount based on split type
 * - Show member avatars and names
 */
export function MemberSplitList({
  splits,
  memberUsers,
  splitType,
  totalAmount,
  onSplitChange,
  onToggleMember,
  className = "",
  disabled = false
}: MemberSplitListProps) {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  
  // Parse total amount for calculations
  const parsedTotalAmount = parseInt(totalAmount) || 0;
  
  // Calculate total percentage to show remaining
  const totalPercentage = parsedTotalAmount > 0 
    ? splits.reduce((sum, split) => sum + ((split.amount / parsedTotalAmount) * 100), 0)
    : 0;
  const remainingPercentage = 100 - totalPercentage;
  
  // Handle starting edit for a member
  const startEdit = (memberId: string, currentValue: number) => {
    setEditingMemberId(memberId);
    // Set initial value based on split type
    if (splitType === "percentage" && parsedTotalAmount > 0) {
      const split = splits.find(s => s.userId === memberId);
      const percentage = split ? (split.amount / parsedTotalAmount) * 100 : 0;
      setEditValue(percentage.toFixed(0));
    } else {
      setEditValue(currentValue.toString());
    }
  };
  
  // Handle saving edit
  const saveEdit = () => {
    if (editingMemberId && editValue) {
      const value = parseInt(editValue) || 0;
      onSplitChange(editingMemberId, value);
    }
    setEditingMemberId(null);
    setEditValue("");
  };
  
  // Handle canceling edit
  const cancelEdit = () => {
    setEditingMemberId(null);
    setEditValue("");
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Member list */}
      <div className="space-y-2">
        {splits.map((split) => {
          const member = memberUsers.find(user => user.id === split.userId);
          if (!member) return null;
          
          // Calculate percentage for display
          const percentage = parsedTotalAmount > 0 
            ? (split.amount / parsedTotalAmount) * 100 
            : 0;
          
          return (
            <div 
              key={split.userId}
              className={`flex items-center space-x-2 p-2 rounded-md ${
                split.amount > 0 ? "bg-accent/30" : "bg-background"
              }`}
            >
              {/* Member checkbox */}
              <Checkbox
                id={`member-${split.userId}`}
                checked={split.amount !== 0}
                onCheckedChange={(checked) => {
                  onToggleMember(split.userId, checked === true);
                }}
                disabled={disabled}
              />
              
              {/* Member avatar and name */}
              <div className="flex items-center space-x-2 flex-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.photoURL || ""} alt={member.displayName || ""} />
                  <AvatarFallback>
                    {member.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.displayName}</span>
              </div>
              
              {/* Split amount/percentage display or edit */}
              <div className="flex items-center">
                {editingMemberId === split.userId ? (
                  <div className="flex items-center space-x-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-20 h-8 text-xs"
                      autoFocus
                      inputMode="numeric"
                    />
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={saveEdit}
                    >
                      ✓
                    </Button>
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={cancelEdit}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    disabled={disabled || split.amount === 0}
                    onClick={() => startEdit(split.userId, split.amount)}
                  >
                    {splitType === "percentage" ? (
                      <span>{percentage.toFixed(0)}%</span>
                    ) : (
                      <span>{formatAmountForDisplay(split.amount.toString())}</span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary footer */}
      {splitType === "percentage" && (
        <div className="text-xs text-muted-foreground mt-2 flex justify-between">
          <span>Đã phân bổ: {totalPercentage.toFixed(0)}%</span>
          <span>Còn lại: {remainingPercentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
