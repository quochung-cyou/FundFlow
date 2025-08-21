import { Button } from "@/components/ui/button";

interface FormActionButtonsProps {
  amount: string;
  validateForm: (options: { showErrors: boolean, forceUpdate: boolean }) => boolean;
  handleSheetOpenChange: (open: boolean) => void;
}

export function FormActionButtons({
  amount,
  validateForm,
  handleSheetOpenChange
}: FormActionButtonsProps) {
  const isAmountValid = !!amount && parseInt(amount) > 0;
  
  const handleValidateClick = () => {
    validateForm({ showErrors: true, forceUpdate: true });
    // Scroll to the top where errors are displayed
    const contentElement = document.querySelector('.transaction-form-content');
    if (contentElement) {
      contentElement.scrollTop = 0;
    }
  };

  return (
    <div className="px-6 py-5 border-t mt-auto sticky bottom-0 bg-background z-10 shadow-md">
      <div className="flex justify-between gap-4 mb-3">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleValidateClick} 
          className="flex-1 h-10"
        >
          Kiểm tra lỗi
        </Button>
      </div>
      <div className="flex justify-between gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleSheetOpenChange(false)} 
          className="flex-1 h-12"
        >
          Hủy
        </Button>
        <Button 
          type="submit" 
          disabled={!isAmountValid} 
          className="flex-1 h-12"
        >
          Thêm giao dịch
        </Button>
      </div>
    </div>
  );
}
