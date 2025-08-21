import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { LLMTransactionResponse } from "@/services/aiService";

export interface AIReasoningDisplayProps {
  prompt: string;
  onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onProcessPrompt: () => void;
  isProcessing: boolean;
  aiResult: LLMTransactionResponse | null;
  className?: string;
  disabled?: boolean;
}

/**
 * AIReasoningDisplay component for AI prompt input and result display
 * Features:
 * - Prompt input textarea
 * - Processing button with loading state
 * - Result display with reasoning
 */
export function AIReasoningDisplay({
  prompt,
  onPromptChange,
  onProcessPrompt,
  isProcessing,
  aiResult,
  className = "",
  disabled = false
}: AIReasoningDisplayProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* AI prompt input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="ai-prompt" className="text-sm font-medium">
            Nhập yêu cầu AI
          </label>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onProcessPrompt}
            disabled={disabled || isProcessing || !prompt.trim()}
            className="h-8"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Xử lý"
            )}
          </Button>
        </div>
        
        <Textarea
          id="ai-prompt"
          placeholder="Ví dụ: Chia tiền ăn trưa 300k, mình trả trước, chia đều cho Nam và Hoa"
          value={prompt}
          onChange={onPromptChange}
          disabled={disabled || isProcessing}
          className="min-h-[80px]"
        />
      </div>
      
      {/* AI result display */}
      {aiResult && (
        <div className="space-y-2 p-3 bg-accent/30 rounded-md">
          <h4 className="text-sm font-medium">Kết quả xử lý AI</h4>
          
          {/* Description result */}
          {aiResult.desc && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Mô tả:</div>
              <div className="text-sm">{aiResult.desc}</div>
            </div>
          )}
          
          {/* Amount result */}
          {aiResult.totalAmount && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Số tiền:</div>
              <div className="text-sm font-medium">
                {new Intl.NumberFormat("vi-VN").format(aiResult.totalAmount)} VND
              </div>
            </div>
          )}
          
          {/* Users/splits result */}
          {aiResult.users && Object.keys(aiResult.users).length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Phân chia:</div>
              <ul className="text-sm space-y-1">
                {Object.entries(aiResult.users).map(([userName, amount], index) => (
                  <li key={index} className="flex justify-between">
                    <span>{userName}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("vi-VN").format(Number(amount))} VND
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Reasoning display */}
          {aiResult.reasoning && (
            <div className="space-y-1 mt-2 pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">Lý giải:</div>
              <div className="text-xs italic whitespace-pre-wrap">
                {aiResult.reasoning}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
