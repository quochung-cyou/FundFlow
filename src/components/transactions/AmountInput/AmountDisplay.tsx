import { formatNumberWithSeparators } from "@/lib/utils";
import { numberToVietnameseText } from "@/utils/transactionUtils";
import { Currency } from "./CurrencySelector";
import { Loader2 } from "lucide-react";

interface AmountDisplayProps {
  amount: string;
  currency?: Currency;
  conversionRate?: number | null;
  isLoading?: boolean;
}

export function AmountDisplay({ amount, currency, conversionRate, isLoading }: AmountDisplayProps) {
  if (!amount || parseInt(amount) === 0) return null;
  
  const amountValue = parseInt(amount);
  const isNegative = amount.startsWith('-');
  const absAmount = Math.abs(amountValue);
  
  // Default to VND if no currency provided
  const displayCurrency = currency || { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" };
  
  // Calculate converted amount if needed
  const needsConversion = displayCurrency.code !== "VND" && conversionRate;
  const convertedAmount = needsConversion ? Math.round(absAmount * (conversionRate || 1)) : absAmount;
  
  return (
    <div className="text-sm text-muted-foreground mt-2 space-y-2 p-3 bg-accent/30 rounded-md">
      <div className="font-medium text-base flex items-center gap-2">
        <span>
          {isNegative ? '-' : ''}{formatNumberWithSeparators(absAmount)} {displayCurrency.code}
        </span>
      </div>
      
      {/* Show conversion to VND if needed */}
      {needsConversion && (
        <div className="flex items-center gap-2 text-sm border-t border-accent pt-2 mt-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Đang tính tỷ giá...</span>
            </div>
          ) : (
            <>
              <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-md">
                1 {displayCurrency.code} = {formatNumberWithSeparators(Math.round(conversionRate || 0))} VND
              </span>
              <span className="flex-1 text-right">
                ≈ {isNegative ? '-' : ''}{formatNumberWithSeparators(convertedAmount)} VND
              </span>
            </>
          )}
        </div>
      )}
      
      <div className="text-xs italic">
        {numberToVietnameseText(needsConversion ? convertedAmount.toString() : amount)}
      </div>
    </div>
  );
}
