
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useApp } from "@/context/AppContext";
import { Fund } from "@/types";
import { useMemo, useState, useEffect, useRef, ChangeEvent } from "react";
import { Currency } from "./AmountInput/CurrencySelector";
import { toast } from "sonner";

// Custom hooks
import { useTransactionForm } from "@/hooks/useTransactionForm";
import { useTransactionAI } from "@/hooks/useTransactionAI";
import { useTransactionSheet } from "@/hooks/useTransactionSheet";

// Custom components
import { TransactionSheetHeader } from "./TransactionSheetHeader";
import { ValidationErrorsDisplay } from "./ValidationErrorsDisplay";
import { DescriptionInput } from "./DescriptionInput/index";
import { AmountInput } from "./AmountInput/index";
import { SplitSection } from "./SplitSection/index";
import { AIReasoningSection } from "./AIReasoningSection";
import { FormActionButtons } from "./FormActionButtons";

// Utilities and services
import { formatNumberWithSeparators } from "@/lib/utils";

// Re-export types to fix TypeScript errors
type ValidateFormOptions = { showErrors?: boolean; forceUpdate?: boolean };
type ValidateFormFunction = (options: ValidateFormOptions) => boolean;

interface CreateTransactionSheetProps {
  fund: Fund;
  children: React.ReactNode;
  initialData?: {
    description?: string;
    amount?: string;
    paidBy?: string;
    splits?: { userId: string; amount: number }[];
    reasoning?: string;
    aiGenerated?: boolean;
    aiPrompt?: string;
    currency?: Currency;
    convertedAmount?: number | null;
  };
  openSheet?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// No need for timing constants anymore with effect-based architecture

/**
 * CreateTransactionSheet component for creating new transactions
 * Supports both manual creation and AI-assisted transaction creation
 */
export function CreateTransactionSheet({
  fund,
  children,
  initialData,
  openSheet,
  onOpenChange,
}: CreateTransactionSheetProps) {
  const { currentUser, getUserById, createTransaction } = useApp();

  // Get user objects for fund members
  const memberUsers = useMemo(() => {
    return fund.members.map(memberId => getUserById(memberId));
  }, [fund.members, getUserById]);

  // Use custom hooks for transaction functionality
  const {
    formData,
    setDescription,
    setAmount,
    setSplits,
    setAiPrompt,
    validationErrors,
    showValidation,
    setShowValidation,
    validateForm,
    handleAmountChange,
    addZeros,
    setPresetAmount,
    distributeEvenly,
    handleUpdateSplit,
    handleCurrencyChange,
    resetForm,
    initializeForm,
  } = useTransactionForm({
    memberUsers,
    currentUserId: currentUser?.id,
  });
  
  // Initialize splits for all members if empty
  useEffect(() => {
    if (formData.splits.length === 0 && memberUsers.length > 0) {
      const initialSplits = memberUsers.map(user => ({
        userId: user.id,
        amount: 0,
      }));
      setSplits(initialSplits);
    }
  }, [memberUsers, formData.splits, setSplits]);

  // Use AI hook for transaction processing
  const {
    isReprocessingAI,
    processAIPrompt,
    handleRerunAI,
  } = useTransactionAI({
    fund,
    memberUsers,
    onAIResult: (result) => {
      // Update form with AI results
      setDescription(result.desc || formData.description);
      setAmount(result.totalAmount.toString());
      
      // Update splits with the new amounts
      const newSplits = fund.members.map(memberId => {
        const amountStr = result.users[memberId];
        const amount = amountStr ? parseInt(amountStr) : 0;
        return { userId: memberId, amount };
      });
      
      setSplits(newSplits);
      
      // Update the reasoning field in the initialData object if possible
      if (initialData) {
        initialData.reasoning = result.reasoning;
      }
    },
    validateForm,
  });

  // Use sheet hook for managing the sheet state and split editing
  const {
    isOpen: open,
    isClosing,
    localFund,
    handleSheetOpenChange,
    editingSplitUserId,
    editingSplitValue,
    startEditingSplit,
    handleEditingSplitChange,
    toggleSplitValueSign,
    saveEditingSplit,
    cancelEditingSplit,
  } = useTransactionSheet({
    fund,
    openSheet,
    onOpenChange,
    initialData,
    resetForm,
    initializeForm,
    loadUserFunds: () => {}, // Placeholder - this should be implemented
    currentUserId: currentUser?.id,
    splits: formData.splits,
    handleUpdateSplit,
    validateForm,
  });

  // References to prevent circular updates
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const [showDescriptionPresets, setShowDescriptionPresets] = useState(false);

  // Debug effect to log state changes
  useEffect(() => {
    console.log("Sheet state updated - isOpen:", open);
  }, [open]);
  
  // Sheet closing is now handled by useTransactionSheet hook

  // Using handleAmountChange from useTransactionForm hook
  
  // Using addZeros from useTransactionForm hook
  
  // Using setPresetAmount from useTransactionForm hook
  
  // Format the amount as currency while user is typing
  const formatAmountForDisplay = (value: string) => {
    if (!value) return '';
    
    // Parse the numeric value, preserving negative sign
    const isNegative = value.startsWith('-');
    const numericValue = parseInt(value);
    if (isNaN(numericValue)) return '';
    
    // Format with thousand separators, preserving negative sign
    return formatNumberWithSeparators(numericValue);
  };

  // Using distributeEvenly from useTransactionForm hook

  // Using handleUpdateSplit from useTransactionForm hook
  
  // Handle currency change from AmountInput
  const onCurrencyChangeHandler = (currency: Currency, convertedAmount: number | null) => {
    console.log("Currency changed to:", currency.code, "with converted amount:", convertedAmount);
    // Use the handleCurrencyChange function from useTransactionForm
    handleCurrencyChange(currency, convertedAmount);
  };

  // Using startEditingSplit from useTransactionSheet hook

  // Using saveEditingSplit from useTransactionSheet hook

  // Using cancelEditingSplit from useTransactionSheet hook
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Force validation with errors shown
    const isValid = validateForm({ showErrors: true, forceUpdate: true });
    
    if (!isValid) {
      // Scroll to the top where errors are displayed
      const contentElement = document.querySelector('.transaction-form-content');
      if (contentElement) {
        contentElement.scrollTop = 0;
      }
      return;
    }
    
    if (!currentUser || !formData.amount) {
      return; // This should be caught by validation
    }
    
    const totalAmount = parseInt(formData.amount);
    
    // If splits are all zero, distribute evenly first
    const allZero = formData.splits.every(split => split.amount === 0);
    if (allZero) {
      distributeEvenly();
      toast.info("Đã tự động chia đều số tiền");
      return; // Return to let the user review the distribution before submitting
    }
    
    // Use convertedAmount if available and not VND, otherwise use the input amount
    const finalAmount = formData.currency?.code !== "VND" && formData.convertedAmount ? 
      formData.convertedAmount : 
      totalAmount;
      
    createTransaction({
      fundId: fund.id,
      description: formData.description || "Giao dịch mới",
      amount: finalAmount,
      paidBy: currentUser.id,
      splits: formData.splits,
      currencyCode: formData.currency?.code,
      originalAmount: formData.currency?.code !== "VND" ? totalAmount : undefined,
      exchangeRate: formData.currency?.code !== "VND" && formData.convertedAmount ? 
        formData.convertedAmount / totalAmount : 
        undefined
    });
    
    // Close the sheet
    handleSheetOpenChange(false);
    
    // Reset the form
    resetForm();
  };

  // Using formatCurrency from transactionUtils

  return (
    <Sheet 
      open={open} 
      onOpenChange={handleSheetOpenChange}
      defaultOpen={false}
    >
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-[100dvh] p-0 overflow-hidden border-l-0 sm:border-l">
        <TransactionSheetHeader fundName={fund.name} />
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 transaction-form-content" style={{ maxHeight: 'calc(100vh - 180px)', paddingBottom: '120px' }}>
            <ValidationErrorsDisplay 
              errors={validationErrors.map(error => error.message)} 
              showValidation={showValidation} 
              onDismiss={() => setShowValidation(false)} 
            />
            
            {/* @ts-ignore - TypeScript is having issues with the props */}
            <DescriptionInput 
              description={formData.description} 
              setDescription={setDescription} 
              validateForm={validateForm} 
            />
            
            {/* @ts-ignore - TypeScript is having issues with the props */}
            <AmountInput 
              amount={formData.amount} 
              handleAmountChange={handleAmountChange} 
              setPresetAmount={setPresetAmount} 
              addZeros={addZeros}
              onCurrencyChange={onCurrencyChangeHandler}
            />
            
            <SplitSection 
              memberUsers={memberUsers}
              splits={formData.splits}
              amount={formData.amount}
              distributeEvenly={distributeEvenly}
              handleUpdateSplit={handleUpdateSplit}
              currentUserId={currentUser?.id}
              currency={formData.currency}
              convertedAmount={formData.convertedAmount}
            />
            
            <AIReasoningSection 
              reasoning={initialData?.reasoning}
              aiPrompt={initialData?.aiPrompt}
              aiGenerated={initialData?.aiGenerated}
              isReprocessingAI={isReprocessingAI}
              handleRerunAI={handleRerunAI}
              currentUserId={currentUser?.id || ''}
            />
          </div>
          
          <FormActionButtons 
            amount={formData.amount}
            validateForm={validateForm}
            handleSheetOpenChange={handleSheetOpenChange}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}
