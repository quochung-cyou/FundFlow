
import { Fund } from "@/types";
import { AiTransactionButton } from "@/components/ai/AiTransactionButton";

interface ChatbotProps {
  fund: Fund;
}

/**
 * Legacy component for backwards compatibility.
 * This simply re-exports the new AiTransactionButton component.
 * @deprecated Use AiTransactionButton instead
 */
export function Chatbot({ fund }: ChatbotProps) {
  return <AiTransactionButton fund={fund} />;
}
