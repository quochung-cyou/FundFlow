import { useState, useRef, useEffect, useCallback } from "react";
import { Fund } from "@/types";
import { TransactionFormData, MemberSplit } from "./useTransactionForm";

export interface UseTransactionSheetProps {
  fund: Fund;
  openSheet?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Partial<TransactionFormData>;
  resetForm: () => void;
  initializeForm: (data: Partial<TransactionFormData>) => void;
  loadUserFunds?: (userId: string) => void;
  currentUserId?: string;
  splits: MemberSplit[];
  handleUpdateSplit: (userId: string, value: number) => void;
  validateForm?: (options?: { showErrors?: boolean; forceUpdate?: boolean }) => boolean;
}

export interface UseTransactionSheetReturn {
  isOpen: boolean;
  isClosing: boolean;
  localFund: Fund;
  handleSheetOpenChange: (open: boolean) => void;
  editingSplitUserId: string | null;
  editingSplitValue: string;
  startEditingSplit: (userId: string) => void;
  handleEditingSplitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleSplitValueSign: () => void;
  saveEditingSplit: () => void;
  cancelEditingSplit: () => void;
}

export const useTransactionSheet = ({
  fund,
  openSheet,
  onOpenChange,
  initialData,
  resetForm,
  initializeForm,
  loadUserFunds,
  currentUserId,
  splits,
  handleUpdateSplit,
  validateForm
}: UseTransactionSheetProps): UseTransactionSheetReturn => {
  // Sheet state
  const [isOpen, setIsOpen] = useState(openSheet || false);
  const [isClosing, setIsClosing] = useState(false);
  const [localFund, setLocalFund] = useState(fund);
  
  // Split editing state
  const [editingSplitUserId, setEditingSplitUserId] = useState<string | null>(null);
  const [editingSplitValue, setEditingSplitValue] = useState<string>("");
  
  // References to prevent circular updates
  const isHandlingOpenChangeRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const initialDataIdRef = useRef<string>("");
  
  // Handle fund changes
  useEffect(() => {
    setLocalFund(fund);
  }, [fund]);
  
  // Separate effect to update localFund when fund changes, but only once per fund change
  useEffect(() => {
    setLocalFund(fund);
  }, [fund.id]);
  
  // Handle sheet open/close transitions
  useEffect(() => {
    // Skip if undefined (uncontrolled component)
    if (openSheet === undefined) return;
    
    // Only update internal state if it differs from the prop
    if (openSheet !== isOpen) {
      console.log("openSheet prop changed to:", openSheet, "(was:", isOpen, ")");
      setIsOpen(openSheet || false);
      
      // Refresh fund data when sheet is opened
      if (openSheet && currentUserId && loadUserFunds) {
        loadUserFunds(currentUserId);
      }
    }
  }, [openSheet, currentUserId, loadUserFunds, isOpen]);
  
  // Core handler for sheet open state changes
  const handleSheetOpenChange = useCallback((open: boolean) => {
    console.log("Sheet open state changing to:", open);
    
    // Set flag to prevent circular updates
    isHandlingOpenChangeRef.current = true;
    
    try {
      // Critical fix: Always notify parent first before changing local state
      // This ensures proper synchronization between parent and child components
      if (onOpenChange) {
        console.log("Notifying parent of sheet state change to:", open);
        onOpenChange(open);
      }
      
      if (!open) {
        // When closing - first set isClosing flag to true
        // An effect will watch this and handle form reset after state update
        setIsClosing(true);
        
        // Reset initialization status and data ID when closing
        hasInitializedRef.current = false;
        initialDataIdRef.current = "";
      }
      
      // Always update the internal open state after parent notification
      setIsOpen(open);
    } finally {
      // Clear the flag after a short delay to allow state updates to process
      setTimeout(() => {
        isHandlingOpenChangeRef.current = false;
      }, 0);
    }
  }, [onOpenChange]);
  
  // Effect to handle sheet opening logic - only runs once when sheet first opens
  useEffect(() => {
    // Only run when sheet transitions from closed to open
    if (isOpen && !hasInitializedRef.current) {
      console.log("Sheet opened for the first time, initializing form");
      
      // Reset form before applying initial data
      resetForm();
      
      // Apply initial data if available
      if (initialData) {
        initializeForm(initialData);
        console.log("Initial data applied:", initialData);
      }
      
      // Mark as initialized to prevent further resets
      hasInitializedRef.current = true;
    }
  }, [isOpen, resetForm, initializeForm, initialData]);
  
  // Effect to handle sheet closing logic
  useEffect(() => {
    if (isClosing) {
      console.log("Effect: Sheet is closing, resetting form");
      // Reset form when closing
      resetForm();
      // Reset the flag
      setIsClosing(false);
    }
  }, [isClosing, resetForm]);
  
  // Effect to handle initialData changes while sheet is open
  // This is separated from the opening logic to prevent double initialization
  useEffect(() => {
    // Generate a unique ID for this initialData to detect real changes
    const currentDataId = initialData ? JSON.stringify(initialData) : "";
    
    // Skip if sheet is not open or we're closing
    if (!isOpen || isClosing) return;
    
    // Skip if initialData is empty
    if (!initialData) return;
    
    // Only update if initialData has genuinely changed from what we've seen before
    // AND we're not in the middle of editing (which would cause data loss)
    if (currentDataId !== initialDataIdRef.current && currentDataId !== "") {
      console.log("initialData changed significantly, updating form");
      
      // Store the current data ID first to prevent loops
      initialDataIdRef.current = currentDataId;
      
      // Apply the new data without resetting first
      initializeForm(initialData);
    }
  }, [initialData, isOpen, isClosing, initializeForm]);
  
  // Split editing handlers
  const startEditingSplit = useCallback((userId: string) => {
    const split = splits.find(s => s.userId === userId);
    setEditingSplitUserId(userId);
    // Preserve negative numbers
    const amountStr = split?.amount.toString() || '0';
    setEditingSplitValue(amountStr);
  }, [splits]);

  const saveEditingSplit = useCallback(() => {
    if (editingSplitUserId && editingSplitValue) {
      const currentSplit = splits.find(s => s.userId === editingSplitUserId);
      if (currentSplit) {
        // Preserve the sign (positive or negative) of the original amount
        const isNegative = currentSplit.amount < 0;
        const newValue = parseInt(editingSplitValue.replace(/[^0-9]/g, '')) || 0;
        handleUpdateSplit(editingSplitUserId, isNegative ? -newValue : newValue);
        
        // Validate after saving the split
        if (validateForm) {
          setTimeout(() => {
            validateForm({ showErrors: false });
          }, 300);
        }
      }
    }
    cancelEditingSplit();
  }, [editingSplitUserId, editingSplitValue, splits, handleUpdateSplit, validateForm]);

  const cancelEditingSplit = useCallback(() => {
    setEditingSplitUserId(null);
    setEditingSplitValue("");
  }, []);

  const handleEditingSplitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isCurrentlyNegative = editingSplitValue.startsWith('-');
    // Only allow digits in the input field, since the negative sign is shown outside
    let value = e.target.value.replace(/[^\d]/g, '');
    
    // Preserve the negative sign if it was already negative
    if (isCurrentlyNegative) {
      value = '-' + value;
    }
    
    // Only update if it's a valid number or empty
    if (/^-?\d*$/.test(value)) {
      setEditingSplitValue(value);
    }
  }, [editingSplitValue]);

  // Add a toggle for negative/positive value
  const toggleSplitValueSign = useCallback(() => {
    if (!editingSplitValue) return;
    
    if (editingSplitValue.startsWith('-')) {
      setEditingSplitValue(editingSplitValue.substring(1));
    } else {
      setEditingSplitValue('-' + editingSplitValue);
    }
  }, [editingSplitValue]);

  return {
    isOpen,
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
  };
};
