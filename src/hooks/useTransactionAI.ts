import { useState, useCallback } from "react";
import { parseTransactionWithLLM, LLMTransactionResponse } from "@/services/aiService";
import { Fund } from "@/types";
import { toast } from "sonner";
import { AI_VALIDATION_DELAY_MS } from "@/constants/transactionConstants";

export interface UseTransactionAIProps {
  fund: Fund;
  memberUsers: Array<{ id: string; displayName: string; email: string; photoURL: string }>;
  onAIResult: (result: LLMTransactionResponse) => void;
  validateForm: (options?: { showErrors?: boolean; forceUpdate?: boolean }) => boolean;
}

export interface UseTransactionAIReturn {
  isReprocessingAI: boolean;
  processAIPrompt: (prompt: string, currentUserId: string) => Promise<boolean>;
  handleRerunAI: (prompt: string, currentUserId: string) => Promise<void>;
}

export const useTransactionAI = ({
  fund,
  memberUsers,
  onAIResult,
  validateForm
}: UseTransactionAIProps): UseTransactionAIReturn => {
  const [isReprocessingAI, setIsReprocessingAI] = useState(false);

  /**
   * Process an AI prompt to generate transaction details
   */
  const processAIPrompt = useCallback(async (prompt: string, currentUserId: string): Promise<boolean> => {
    try {
      // Call the AI service to parse the transaction
      const result = await parseTransactionWithLLM(
        prompt, 
        fund, 
        memberUsers,
        currentUserId
      );
      
      console.log("AI results received:", result);
      
      // Update form with results
      onAIResult(result);
      
      // Validate the AI-generated transaction after a delay
      setTimeout(() => {
        const isValid = validateForm({ showErrors: true, forceUpdate: true });
        
        if (isValid) {
          toast.success("Đã cập nhật kết quả AI", {
            description: "Giao dịch đã được cập nhật với kết quả mới từ AI"
          });
        } else {
          toast.warning("Kết quả AI có thể cần điều chỉnh", {
            description: "Vui lòng kiểm tra các lỗi được hiển thị"
          });
          
          // Scroll to the top where errors are displayed
          const contentElement = document.querySelector('.transaction-form-content');
          if (contentElement) {
            contentElement.scrollTop = 0;
          }
        }
      }, AI_VALIDATION_DELAY_MS);
      
      return true;
    } catch (error) {
      // Handle errors and show helpful messages
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Không thể xử lý yêu cầu';
      
      toast.error(errorMessage, {
        duration: 5000,
        description: 'Vui lòng thử lại với mô tả chi tiết hơn'
      });
      return false;
    }
  }, [fund, memberUsers, onAIResult, validateForm]);

  /**
   * Handler for the AI rerun functionality
   */
  const handleRerunAI = useCallback(async (prompt: string, currentUserId: string) => {
    if (!prompt || isReprocessingAI || !currentUserId) {
      toast.error("Không thể xử lý", { description: "Thiếu thông tin AI cần thiết" });
      return;
    }
    
    setIsReprocessingAI(true);
    console.log("Re-running AI with prompt:", prompt);
    
    try {
      await processAIPrompt(prompt, currentUserId);
    } finally {
      setIsReprocessingAI(false);
    }
  }, [isReprocessingAI, processAIPrompt]);

  return {
    isReprocessingAI,
    processAIPrompt,
    handleRerunAI,
  };
};
