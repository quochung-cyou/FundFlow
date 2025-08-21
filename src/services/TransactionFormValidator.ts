import { TransactionValidator } from "./TransactionValidator";
import { User } from "@/types";

/**
 * Validation error interface for transaction form
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Extended validator class specifically for transaction form validation
 * Handles validation of form inputs and provides user-friendly error messages
 */
export class TransactionFormValidator {
  private members: User[];
  
  /**
   * Create a new transaction form validator
   * @param members List of fund members to validate against
   */
  constructor(members: User[]) {
    this.members = members;
  }
  
  /**
   * Validate the description field
   * @param description The transaction description
   * @returns Array of validation errors, empty if valid
   */
  public validateDescription(description: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!description || description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Vui lòng nhập mô tả giao dịch',
        severity: 'error'
      });
    } else if (description.length < 3) {
      errors.push({
        field: 'description',
        message: 'Mô tả quá ngắn, vui lòng nhập ít nhất 3 ký tự',
        severity: 'warning'
      });
    }
    
    return errors;
  }
  
  /**
   * Validate the amount field
   * @param amount The transaction amount as a string
   * @returns Array of validation errors, empty if valid
   */
  public validateAmount(amount: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!amount || amount.trim() === '') {
      errors.push({
        field: 'amount',
        message: 'Vui lòng nhập số tiền',
        severity: 'error'
      });
      return errors;
    }
    
    const numericAmount = parseInt(amount);
    
    if (isNaN(numericAmount)) {
      errors.push({
        field: 'amount',
        message: 'Số tiền không hợp lệ',
        severity: 'error'
      });
    } else if (numericAmount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Số tiền phải lớn hơn 0',
        severity: 'error'
      });
    } else if (numericAmount < 1000) {
      errors.push({
        field: 'amount',
        message: 'Số tiền quá nhỏ, có thể bạn đã nhập thiếu số 0?',
        severity: 'warning'
      });
    } else if (numericAmount > 100000000) {
      errors.push({
        field: 'amount',
        message: 'Số tiền quá lớn, vui lòng kiểm tra lại',
        severity: 'warning'
      });
    }
    
    return errors;
  }
  
  /**
   * Validate the splits array
   * @param splits The transaction splits
   * @param totalAmount The total transaction amount
   * @returns Array of validation errors, empty if valid
   */
  public validateSplits(splits: { userId: string; amount: number }[], totalAmount: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!splits || splits.length === 0) {
      errors.push({
        field: 'splits',
        message: 'Không có thông tin chia tiền',
        severity: 'error'
      });
      return errors;
    }
    
    // Check if all splits are zero
    const allZero = splits.every(split => split.amount === 0);
    if (allZero) {
      errors.push({
        field: 'splits',
        message: 'Vui lòng phân chia số tiền giữa các thành viên',
        severity: 'error'
      });
    }
    
    // Calculate the sum of all splits
    const totalSplits = splits.reduce((sum, split) => sum + split.amount, 0);
    
    // Check if the sum of all splits is significantly different from zero
    if (Math.abs(totalSplits) > 10) {
      errors.push({
        field: 'splits',
        message: `Tổng số tiền chia không cân bằng, dư ra (${totalSplits}). Vui lòng điều chỉnh lại`,
        severity: 'error'
      });
    }
    


    return errors;
  }
  
  /**
   * Validate the entire transaction form
   * @param description The transaction description
   * @param amount The transaction amount as a string
   * @param splits The transaction splits
   * @returns Array of all validation errors
   */
  public validateForm(description: string, amount: string, splits: { userId: string; amount: number }[]): ValidationError[] {
    // Combine all validation errors
    const descriptionErrors = this.validateDescription(description);
    const amountErrors = this.validateAmount(amount);
    
    // Only validate splits if amount is valid
    let splitErrors: ValidationError[] = [];
    if (amountErrors.length === 0 && amount) {
      const numericAmount = parseInt(amount);
      if (!isNaN(numericAmount) && numericAmount > 0) {
        splitErrors = this.validateSplits(splits, numericAmount);
      }
    }
    
    return [...descriptionErrors, ...amountErrors, ...splitErrors];
  }
}
