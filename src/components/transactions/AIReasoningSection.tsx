import { Button } from "@/components/ui/button";
import { RefreshCwIcon, SparklesIcon } from "lucide-react";

interface AIReasoningSectionProps {
  reasoning?: string;
  aiPrompt?: string;
  aiGenerated?: boolean;
  isReprocessingAI: boolean;
  handleRerunAI: (prompt: string, userId: string) => void;
  currentUserId: string;
}

export function AIReasoningSection({
  reasoning,
  aiPrompt,
  aiGenerated,
  isReprocessingAI,
  handleRerunAI,
  currentUserId
}: AIReasoningSectionProps) {
  if (!reasoning) return null;

  return (
    <div className="my-4 p-3 bg-muted/50 border rounded-md max-h-[30vh] overflow-y-auto">
      <div className="flex justify-between items-center sticky top-0 bg-muted/50 py-1">
        <div className="text-sm font-medium">Gợi ý từ AI:</div>
        {aiGenerated && (
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            className="h-7 gap-1 text-xs" 
            onClick={() => handleRerunAI(aiPrompt || '', currentUserId)}
            disabled={isReprocessingAI || !aiPrompt}
          >
            {isReprocessingAI ? (
              <>
                <RefreshCwIcon className="h-3 w-3 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <RefreshCwIcon className="h-3 w-3" />
                <span>Chạy lại AI</span>
              </>
            )}
          </Button>
        )}
      </div>
      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{reasoning}</div>
      
      {/* Show original prompt if available */}
      {aiPrompt && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <SparklesIcon className="h-3 w-3" />
            <span>Prompt gốc:</span>
          </div>
          <div className="text-xs italic text-muted-foreground">{aiPrompt}</div>
        </div>
      )}
    </div>
  );
}
