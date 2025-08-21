import { useState, useRef, useCallback, useEffect } from "react";
import { TransactionFormValidator, ValidationError } from "@/services/TransactionFormValidator";
import { DEFAULT_FORM_VALUES, VALIDATION_DEBOUNCE_MS } from "@/constants/transactionConstants";
import { sanitizeAmountInput, calculateEvenDistribution, addZerosToAmount } from "@/utils/transactionUtils";
import { Currency } from "@/components/transactions/AmountInput/CurrencySelector";

export interface MemberSplit {
  userId: string;
  amount: number;
}

export interface TransactionFormData {
  description: string;
  amount: string;
  splits: MemberSplit[];
  aiPrompt: string;
  currency: Currency;
  convertedAmount: number | null;
}

export interface UseTransactionFormProps {
  memberUsers: Array<{ id: string; displayName: string; email: string; photoURL: string }>;
  currentUserId?: string;
}

export interface UseTransactionFormReturn {
  // Form data
  formData: TransactionFormData;
  
  // Form actions
  setDescription: (value: string) => void;
  setAmount: (value: string) => void;
  setSplits: (splits: { userId: string; amount: number }[]) => void;
  setAiPrompt: (value: string) => void;
  setCurrency: (currency: Currency) => void;
  setConvertedAmount: (amount: number | null) => void;
  
  // Validation
  validationErrors: ValidationError[];
  showValidation: boolean;
  setShowValidation: (show: boolean) => void;
  validateForm: (options?: { showErrors?: boolean; forceUpdate?: boolean }) => boolean;
  
  // Form utilities
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addZeros: (count: number) => void;
  setPresetAmount: (value: number) => void;
  distributeEvenly: () => void;
  handleUpdateSplit: (userId: string, value: number) => void;
  handleCurrencyChange: (currency: Currency, convertedAmount: number | null) => void;
  resetForm: () => void;
  initializeForm: (data: Partial<TransactionFormData>) => void;
}

export const useTransactionForm = ({ 
  memberUsers, 
  currentUserId 
}: UseTransactionFormProps): UseTransactionFormReturn => {
  // Form state
  const [description, setDescription] = useState<string>(DEFAULT_FORM_VALUES.description);
  const [amount, setAmount] = useState<string>(DEFAULT_FORM_VALUES.amount);
  const [splits, setSplits] = useState<{ userId: string; amount: number }[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>(DEFAULT_FORM_VALUES.aiPrompt);
  const [currency, setCurrency] = useState<Currency>({ code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" });
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [lastValidatedAt, setLastValidatedAt] = useState<number>(0);
  
  // Validator reference
  const validatorRef = useRef<TransactionFormValidator | null>(null);
  
  // Initialize validator when member users change
  if (memberUsers.length > 0 && !validatorRef.current) {
    validatorRef.current = new TransactionFormValidator(memberUsers);
  }
  
  // Validate form function
  const validateForm = useCallback((options?: { showErrors?: boolean; forceUpdate?: boolean }) => {
    const showErrors = options?.showErrors ?? true;
    const forceUpdate = options?.forceUpdate ?? false;
    
    // Skip validation if no validator or if we've validated recently (unless forced)
    const now = Date.now();
    if (!validatorRef.current || (!forceUpdate && now - lastValidatedAt < VALIDATION_DEBOUNCE_MS)) {
      return validationErrors.length === 0;
    }
    
    // Perform validation
    const errors = validatorRef.current.validateForm(description, amount, splits);
    
    // Update state if errors changed or if forced
    if (forceUpdate || JSON.stringify(errors) !== JSON.stringify(validationErrors)) {
      setValidationErrors(errors);
      setLastValidatedAt(now);
      
      if (showErrors && errors.length > 0) {
        setShowValidation(true);
      }
    }
    
    return errors.length === 0;
  }, [description, amount, splits, validationErrors, lastValidatedAt]);
  
  // Handle amount input changes with sanitization
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeAmountInput(e.target.value);
    
    // Validate the input
    if (/^-?\d*$/.test(sanitizedValue)) {
      setAmount(sanitizedValue);
      
      // Reset splits when amount changes
      if (splits.length > 0 && sanitizedValue) {
        const resetSplits = splits.map(split => ({
          userId: split.userId,
          amount: 0
        }));
        setSplits(resetSplits);
      }
      
      // Validate after a delay
      setTimeout(() => {
        validateForm({ showErrors: false });
      }, VALIDATION_DEBOUNCE_MS);
    }
  }, [splits, validateForm]);
  
  // Add zeros to amount
  const addZeros = useCallback((count: number) => {
    const newAmount = addZerosToAmount(amount, count);
    setAmount(newAmount);
  }, [amount]);
  
  // Set preset amount
  const setPresetAmount = useCallback((value: number) => {
    setAmount(value.toString());
  }, []);
  
  // Distribute amount evenly among members
  const distributeEvenly = useCallback(() => {
    if (!amount || !currentUserId || !memberUsers.length) return;
    
    // If we have a foreign currency but no conversion rate yet, don't proceed
    if (currency.code !== "VND" && convertedAmount === null) {
      console.log("Cannot distribute evenly yet - waiting for conversion rate");
      return;
    }
    
    // Use the converted amount if available and currency is not VND
    let totalAmount = parseInt(amount);
    if (currency.code !== "VND" && convertedAmount) {
      totalAmount = convertedAmount;
    }
    
    if (!totalAmount || memberUsers.length <= 1) return;
    
    const memberIds = memberUsers.map(user => user.id);
    const newSplits = calculateEvenDistribution(totalAmount, memberIds, currentUserId);
    
    setSplits(newSplits);
    
    // Validate after distributing
    setTimeout(() => {
      validateForm({ showErrors: false });
    }, 300);
  }, [amount, convertedAmount, currency, currentUserId, memberUsers, validateForm]);
  
  // Update individual split
  const handleUpdateSplit = useCallback((userId: string, value: number) => {
    // If we're using a foreign currency and have a conversion rate,
    // we need to adjust the split value based on the conversion rate
    let splitAmount = value;
    
    // No need to adjust the value as it's already in the correct currency
    // The conversion is handled at the transaction creation level
    
    setSplits(prev => 
      prev.map(split => 
        split.userId === userId 
          ? { ...split, amount: splitAmount } 
          : split
      )
    );
    
    // Validate after a delay
    setTimeout(() => {
      validateForm({ showErrors: false });
    }, VALIDATION_DEBOUNCE_MS);
  }, [validateForm]);
  
  // Handle currency change
  const handleCurrencyChange = useCallback((newCurrency: Currency, newConvertedAmount: number | null) => {
    console.log("useTransactionForm - handleCurrencyChange:", { newCurrency, newConvertedAmount });
    setCurrency(newCurrency);
    setConvertedAmount(newConvertedAmount);
  }, []);
  
  // Effect to recalculate splits when convertedAmount changes
  useEffect(() => {
    // Skip if we don't have a valid amount or convertedAmount
    if (!amount || !convertedAmount || !currentUserId || !memberUsers.length) return;
    
    // Only recalculate if we have a foreign currency and splits exist
    if (currency.code !== "VND" && splits.length > 0) {
      console.log("Recalculating splits due to convertedAmount change:", convertedAmount);
      
      // Recalculate splits based on the new convertedAmount
      const memberIds = memberUsers.map(user => user.id);
      const newSplits = calculateEvenDistribution(convertedAmount, memberIds, currentUserId);
      setSplits(newSplits);
    }
  }, [convertedAmount, currency.code, amount, currentUserId, memberUsers, splits.length]);

  // Reset form to default values
  const resetForm = useCallback(() => {
    setDescription(DEFAULT_FORM_VALUES.description);
    setAmount(DEFAULT_FORM_VALUES.amount);
    setSplits([]);
    setAiPrompt(DEFAULT_FORM_VALUES.aiPrompt);
    setCurrency({ code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" });
    setConvertedAmount(null);
    setValidationErrors([]);
    setShowValidation(false);
    setLastValidatedAt(0);
  }, []);
  
  // Initialize form with data
  const initializeForm = useCallback((data: Partial<TransactionFormData>) => {
    if (data.description !== undefined) setDescription(data.description);
    if (data.amount !== undefined) setAmount(data.amount);
    if (data.aiPrompt !== undefined) setAiPrompt(data.aiPrompt);
    if (data.currency !== undefined) setCurrency(data.currency);
    if (data.convertedAmount !== undefined) setConvertedAmount(data.convertedAmount);
    
    if (data.splits && data.splits.length > 0) {
      const validSplits = data.splits.map(split => ({
        userId: split.userId,
        amount: typeof split.amount === 'number' ? split.amount : 0
      }));
      setSplits(validSplits);
    } else if (memberUsers.length > 0) {
      // Initialize empty splits for all members
      const initialSplits = memberUsers.map(user => ({
        userId: user.id,
        amount: 0,
      }));
      setSplits(initialSplits);
    }
  }, [memberUsers]);
  
  return {
    // Form data
    formData: {
      description,
      amount,
      splits,
      aiPrompt,
      currency,
      convertedAmount,
    },
    
    // Form actions
    setDescription,
    setAmount,
    setSplits,
    setAiPrompt,
    setCurrency,
    setConvertedAmount,
    
    // Validation
    validationErrors,
    showValidation,
    setShowValidation,
    validateForm,
    
    // Form utilities
    handleAmountChange,
    addZeros,
    setPresetAmount,
    distributeEvenly,
    handleUpdateSplit,
    handleCurrencyChange,
    resetForm,
    initializeForm,
  };
};
