import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PRESET_AMOUNTS, ZERO_ADDITIONS } from "@/constants/transactionConstants";
import { formatAmountForDisplay, addZerosToAmount } from "@/utils/transactionUtils";
import { numberToVietnameseText } from "@/lib/utils";

export interface AmountInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddZeros?: (count: number) => void;
  onSetPreset?: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * AmountInput component for transaction amounts
 * Features:
 * - Formatted display with thousand separators
 * - Quick preset buttons
 * - Zero addition buttons
 * - Vietnamese text conversion
 */
export function AmountInput({
  value,
  onChange,
  onAddZeros,
  onSetPreset,
  className = "",
  disabled = false
}: AmountInputProps) {
  // Parse the amount for display
  const parsedAmount = value ? parseInt(value) : 0;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative mb-6">
        <Input
          id="amount"
          placeholder="Nhập số tiền"
          value={value}
          onChange={onChange}
          inputMode="numeric"
          required
          disabled={disabled}
          className="pl-12 h-14 text-right font-medium text-xl"
          style={{ fontSize: '1.25rem', paddingTop: '16px', paddingBottom: '16px' }}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
          <span className="font-medium">VND</span>
        </div>
      </div>
      
      {/* Amount display in formatted text */}
      {value && parseInt(value) !== 0 && (
        <div className="text-sm text-muted-foreground mt-2 space-y-2 p-3 bg-accent/30 rounded-md">
          <div className="font-medium text-base">
            {value.startsWith('-') ? '-' : ''}{formatAmountForDisplay(value)} VND
          </div>
          <div className="text-xs italic">
            {numberToVietnameseText(value)}
          </div>
        </div>
      )}
      
      {/* Preset amount buttons */}
      {onSetPreset && (
        <>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {PRESET_AMOUNTS.slice(0, 4).map((amount) => (
              <Button 
                key={amount}
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => onSetPreset(amount)}
                disabled={disabled}
                className="text-xs h-8"
              >
                {amount >= 1000000 
                  ? `${amount / 1000000} triệu`
                  : new Intl.NumberFormat("vi-VN").format(amount)}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-1">
            {PRESET_AMOUNTS.slice(4).map((amount) => (
              <Button 
                key={amount}
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => onSetPreset(amount)}
                disabled={disabled}
                className="text-xs h-8"
              >
                {amount >= 1000000 
                  ? `${amount / 1000000} triệu`
                  : new Intl.NumberFormat("vi-VN").format(amount)}
              </Button>
            ))}
          </div>
        </>
      )}
      
      {/* Quick zeros buttons */}
      {onAddZeros && (
        <div className="flex gap-2 mt-1">
          {ZERO_ADDITIONS.map((addition) => (
            <Button 
              key={addition.count}
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => onAddZeros(addition.count)}
              disabled={disabled}
              className="flex-1 text-xs h-8"
            >
              {addition.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
