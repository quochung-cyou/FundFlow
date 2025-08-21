import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmountDisplay } from "./AmountDisplay";
import { QuickAmountButtons } from "./QuickAmountButtons";
import { QuickZerosButtons } from "./QuickZerosButtons";
import { CurrencySelector, Currency, commonCurrencies } from "./CurrencySelector";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";

interface AmountInputProps {
  amount: string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setPresetAmount: (amount: number) => void;
  addZeros: (count: number) => void;
  onCurrencyChange?: (currency: Currency, convertedAmount: number) => void;
}

export function AmountInput({
  amount,
  handleAmountChange,
  setPresetAmount,
  addZeros,
  onCurrencyChange
}: AmountInputProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(commonCurrencies[0]); // Default to VND
  
  // Only use conversion if not VND
  const targetCurrency = commonCurrencies[0]; // Always convert to VND
  const { conversionRate, isLoading, convertAmount } = useCurrencyConversion(selectedCurrency, targetCurrency);
  
  const handleCurrencyChange = (currency: Currency) => {
    console.log("AmountInput - handleCurrencyChange:", {
      newCurrency: currency.code,
      amount,
      conversionRate,
      hasOnCurrencyChange: !!onCurrencyChange
    });
    
    setSelectedCurrency(currency);
    
    // If we have an amount, convert the amount
    if (amount && onCurrencyChange) {
      const amountNum = parseInt(amount) || 0;
      
      // For VND, no conversion needed
      if (currency.code === "VND") {
        onCurrencyChange(currency, amountNum);
        return;
      }
      
      // For other currencies, always set the currency immediately
      // If conversion rate is not available, we'll update it in the useEffect when it arrives
      if (!conversionRate) {
        console.log("No conversion rate yet, setting currency without conversion");
        onCurrencyChange(currency, null);
        return;
      }
      
      // We have a conversion rate, so convert the amount
      const convertedAmountToVND = Math.round(convertAmount(amountNum));
      console.log("Converting", amountNum, currency.code, "to VND:", convertedAmountToVND);
      
      onCurrencyChange(currency, convertedAmountToVND);
    }
  };
  
  // Effect to update converted amount when conversion rate becomes available
  useEffect(() => {
    // Skip if no amount, no onCurrencyChange, or if currency is VND
    if (!amount || !onCurrencyChange || selectedCurrency.code === "VND") return;
    
    // Skip if conversion rate is not available yet
    if (!conversionRate) return;
    
    const amountNum = parseInt(amount) || 0;
    const convertedAmountToVND = Math.round(convertAmount(amountNum));
    
    console.log("useEffect - Conversion rate changed, updating converted amount:", {
      from: selectedCurrency.code,
      amount: amountNum,
      conversionRate,
      convertedAmount: convertedAmountToVND
    });
    
    // Update the converted amount with the new conversion rate
    onCurrencyChange(selectedCurrency, convertedAmountToVND);
  }, [conversionRate, amount, selectedCurrency, onCurrencyChange]);
  return (
    <div className="space-y-2">
      <Label htmlFor="amount">Số tiền</Label>
      
      {/* Currency selector */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="col-span-1">
          <CurrencySelector 
            selectedCurrency={selectedCurrency} 
            onCurrencyChange={handleCurrencyChange} 
          />
        </div>
        <div className="col-span-3 relative">
          <Input
            id="amount"
            placeholder="Nhập số tiền"
            value={amount}
            onChange={handleAmountChange}
            inputMode="numeric"
            required
            className="h-10 text-right font-medium text-lg pr-8"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
            <span className="font-medium">{selectedCurrency.symbol}</span>
          </div>
        </div>
      </div>
      
      {/* Amount display with conversion if needed */}
      <AmountDisplay 
        amount={amount} 
        currency={selectedCurrency} 
        conversionRate={conversionRate} 
        isLoading={isLoading} 
      />
      
      <QuickAmountButtons setPresetAmount={setPresetAmount} />
      <QuickZerosButtons addZeros={addZeros} />
    </div>
  );
}
