import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SplitType } from "@/types";
import { MemberSplit } from "@/hooks/useTransactionForm";

export interface SplitEditorProps {
  splitType: SplitType;
  onSplitTypeChange: (type: SplitType) => void;
  onDistributeEvenly: () => void;
  onDistributeByPercentage: () => void;
  onClearSplits: () => void;
  splits: MemberSplit[];
  className?: string;
  disabled?: boolean;
}

/**
 * SplitEditor component for managing transaction split types and distribution
 * Features:
 * - Split type selection (even, custom, percentage)
 * - Quick distribution actions
 * - Clear splits option
 */
export function SplitEditor({
  splitType,
  onSplitTypeChange,
  onDistributeEvenly,
  onDistributeByPercentage,
  onClearSplits,
  splits,
  className = "",
  disabled = false
}: SplitEditorProps) {
  const [showActions, setShowActions] = useState(false);
  
  // Count active splits (members with non-zero amounts)
  const activeSplitsCount = splits.filter(split => split.amount !== 0).length;
  
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Phân chia</Label>
        
        {/* Toggle actions button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowActions(!showActions)}
          className="text-xs h-7 px-2"
        >
          {showActions ? "Ẩn tùy chọn" : "Hiện tùy chọn"}
        </Button>
      </div>
      
      {/* Split type selection */}
      <RadioGroup
        value={splitType}
        onValueChange={(value) => onSplitTypeChange(value as SplitType)}
        className="grid grid-cols-3 gap-2"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="even" id="split-even" />
          <Label htmlFor="split-even" className="text-sm cursor-pointer">Đều nhau</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="split-custom" />
          <Label htmlFor="split-custom" className="text-sm cursor-pointer">Tùy chỉnh</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="percentage" id="split-percentage" />
          <Label htmlFor="split-percentage" className="text-sm cursor-pointer">Phần trăm</Label>
        </div>
      </RadioGroup>
      
      {/* Quick actions */}
      {showActions && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDistributeEvenly}
            disabled={disabled || activeSplitsCount === 0}
            className="text-xs h-8"
          >
            Chia đều ({activeSplitsCount} người)
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDistributeByPercentage}
            disabled={disabled || activeSplitsCount === 0}
            className="text-xs h-8"
          >
            Chia theo %
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearSplits}
            disabled={disabled || activeSplitsCount === 0}
            className="text-xs h-8 col-span-2"
          >
            Xóa tất cả phân chia
          </Button>
        </div>
      )}
    </div>
  );
}
