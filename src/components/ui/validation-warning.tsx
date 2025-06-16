import { AlertTriangleIcon, XCircleIcon, AlertCircleIcon } from "lucide-react";
import { ValidationError } from "@/services/TransactionFormValidator";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useEffect, useState } from "react";

interface ValidationWarningProps {
  errors: ValidationError[];
  onDismiss?: () => void;
  className?: string;
}

export function ValidationWarning({ errors, onDismiss, className }: ValidationWarningProps) {
  const [visible, setVisible] = useState(true);
  
  // Reset visibility when errors change
  useEffect(() => {
    if (errors.length > 0) {
      setVisible(true);
    }
  }, [errors]);
  
  if (!visible || errors.length === 0) {
    return null;
  }
  
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Count errors by severity
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  
  return (
    <div 
      className={cn(
        "bg-destructive/10 border border-destructive/30 rounded-md p-4 mb-4 animate-in fade-in",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="h-5 w-5 text-destructive" />
          <h4 className="font-medium text-destructive">
            {errorCount > 0 
              ? `${errorCount} lỗi cần sửa` 
              : warningCount > 0 
                ? `${warningCount} cảnh báo` 
                : "Lỗi xác thực"}
          </h4>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={handleDismiss}
        >
          <XCircleIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {errors.map((error, index) => (
          <div 
            key={`${error.field}-${index}`} 
            className={cn(
              "flex items-start gap-2 text-sm p-2 rounded-sm",
              error.severity === 'error' 
                ? "bg-destructive/15 text-destructive" 
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            )}
          >
            {error.severity === 'error' ? (
              <XCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{error.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
