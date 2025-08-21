import { ValidationWarning } from "@/components/ui/validation-warning";
import { ValidationError } from "@/services/TransactionFormValidator";

interface ValidationErrorsDisplayProps {
  errors: string[];
  showValidation: boolean;
  onDismiss: () => void;
  className?: string;
}

export function ValidationErrorsDisplay({ 
  errors, 
  showValidation, 
  onDismiss,
  className
}: ValidationErrorsDisplayProps) {
  if (!showValidation || errors.length === 0) return null;
  
  // Convert string errors to ValidationError objects
  const validationErrors: ValidationError[] = errors.map(message => ({
    field: 'general',
    message,
    severity: 'error'
  }));
  
  return (
    <ValidationWarning 
      errors={validationErrors} 
      onDismiss={onDismiss}
      className={`sticky top-0 z-20 ${className || ''}`}
    />
  );
}
