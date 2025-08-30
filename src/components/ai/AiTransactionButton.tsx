import { useState, useRef, useEffect } from "react";
import { Fund, Split } from "@/types";
import { Button } from "@/components/ui/button";
import { SparklesIcon, Loader2Icon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseTransactionWithLLM, LLMTransactionResponse, AIModel, getAvailableModels } from "@/services/aiService";
import { saveAIPrompt } from "@/services/aiPromptStorage";
import { CreateTransactionSheet } from "@/components/transactions/CreateTransactionSheet";
import { Textarea } from "../ui/textarea";

interface AiTransactionButtonProps {
  fund: Fund;
  variant?: "default" | "outline" | "magical";
  className?: string;
}

export function AiTransactionButton({
  fund,
  variant = "magical",
  className = "",
}: AiTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState<LLMTransactionResponse | null>(null);
  const [openTransactionSheet, setOpenTransactionSheet] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [availableProviders, setAvailableProviders] = useState<('google' | 'openai' | 'groq')[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const transactionSheetRef = useRef<HTMLButtonElement>(null);
  const [showApiInfo, setShowApiInfo] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");

  const { createTransaction, getUserById, currentUser } = useApp();

  // Load available models based on fund's API keys
  useEffect(() => {
    const loadAvailableModels = async () => {
      try {
        setIsLoadingModels(true);
        const { availableModels: models, availableProviders: providers } = await getAvailableModels(fund);
        setAvailableModels(models);
        setAvailableProviders(providers);

        // Check for stored model preference
        const storedModelId = localStorage.getItem(`ai-model-preference-${fund.id}`);

        // Set a default model based on availability
        if (storedModelId && models.some(m => m.id === storedModelId && m.isAvailable)) {
          // Use stored preference if available
          setSelectedModelId(storedModelId);
        } else if (models.length > 0) {
          // Use first available model
          const defaultModel = models.find(m => m.provider === 'google') || models[0];
          setSelectedModelId(defaultModel.id);
        } else {
          // If no models available, default to Gemini 2.0 Flash (won't work but UI will show message)
          setSelectedModelId('gemini-2.0-flash');
        }
      } catch (error) {
        console.error('Error loading available models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadAvailableModels();
  }, [fund]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get member users from fund
  const memberUsers = fund.members.map(id => {
    const user = getUserById(id);
    return user || { id, displayName: 'Unknown', email: '', photoURL: '' };
  });

  // Process a message with AI - properly handles state transitions
  const processMessage = async () => {
    if (!input.trim() || processing) return;

    // Check if we have available models
    if (availableProviders.length === 0) {
      toast.error('Không thể sử dụng trợ lý AI', {
        description: 'Vui lòng thêm API key trong cài đặt quỹ'
      });
      return;
    }

    // Step 1: Reset previous transaction state
    // We set these states first and let the effect chain handle the opening
    // of the transaction sheet when response is set
    setResponse(null);
    setOpenTransactionSheet(false);
    
    // Save a copy of the input for later use
    const currentInput = input.trim();
    setCurrentPrompt(currentInput);
    
    // Step 2: Start processing and set processing state
    setProcessing(true);

    try {
      console.log("Processing AI prompt:", currentInput);
      
      // Step 3: Call the AI service
      const result = await parseTransactionWithLLM(
        currentInput,
        fund,
        memberUsers,
        currentUser?.id, // Pass current user ID for context
        selectedModelId // Pass selected model ID
      );

      console.log("AI result received:", result);

      // Save the prompt to local storage
      saveAIPrompt(currentInput, fund, result.desc);

      // Save the selected model preference
      if (fund.id) {
        localStorage.setItem(`ai-model-preference-${fund.id}`, selectedModelId);
      }

      // Step 4: Process AI result with pure function
      const processedResult = processAIResult(result);
      if (!processedResult) {
        // If processing failed, don't continue
        return;
      }
      
      // Step 5: Update UI state in the correct sequence
      // First close dialog - this action doesn't depend on state updates
      setIsOpen(false);
      setInput("");
      
      // Step 6: Set response state - this will trigger the useEffect that opens the sheet
      // An effect hook will watch for this state change and open the sheet
      setResponse(processedResult);
      // We DO NOT directly set openTransactionSheet here - it's handled by the effect
      
    } catch (error) {
      console.error('Error processing message:', error);

      // Display more helpful error message from the API
      const errorMessage = error instanceof Error
        ? error.message
        : 'Không thể xử lý yêu cầu';

      toast.error(errorMessage, {
        duration: 5000,
        description: 'Vui lòng thử lại với mô tả chi tiết hơn'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Pure function to process AI response without side effects
  const processAIResult = (result: LLMTransactionResponse): LLMTransactionResponse | null => {
    if (!result) return null;

    try {
      // Validate payer exists in the fund
      const payerUser = memberUsers.find(user => user.id === result.payer);
      if (!payerUser) {
        toast.error('Không tìm thấy người trả tiền trong quỹ');
        return null;
      }

      // Process splits for all members
      const processedSplits: Split[] = fund.members.map(memberId => {
        const amountStr = result.users[memberId];
        const amount = amountStr ? parseInt(amountStr) : 0;
        return { userId: memberId, amount };
      });

      console.log("Processed splits:", processedSplits);
      
      // Return a clean processed transaction data object
      return {
        ...result,
        payer: payerUser.id,
        desc: result.desc || 'Giao dịch mới',
        // Ensure we have proper splits
        users: Object.fromEntries(
          processedSplits.map(split => [split.userId, split.amount.toString()])
        )
      };
    } catch (error) {
      console.error('Error processing AI result:', error);
      toast.error('Không thể chuẩn bị dữ liệu giao dịch');
      return null;
    }
  };

  // Suggested prompts for quick use
  const suggestedPrompts = [
    "Hôm nay ăn sáng mỗi người 15k",
    "Hung trả tiền taxi 200k, Thiện trả 120k",
    "Tiền ăn tổng 600k, chia đều"
  ];

  // Button variants
  const buttonClasses = variant === "magical"
    ? "bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0"
    : "";
    
  // Clean up state when component unmounts
  useEffect(() => {
    return () => {
      setOpenTransactionSheet(false);
      setResponse(null);
      setInput("");
    };
  }, []);
  
  // This effect synchronizes response state with openTransactionSheet state
  // It's the core of our state coordination between components
  useEffect(() => {
    // Only act when we have a response and the sheet isn't already open
    if (response && !openTransactionSheet && !processing) {
      console.log("Effect: Response exists but sheet not open - opening sheet");
      // Open the transaction sheet when response state is set
      setOpenTransactionSheet(true);
    }
    
    // If we don't have a response but the sheet is open, close it (prevents ghost reopening)
    if (!response && openTransactionSheet && !processing) {
      console.log("Effect: No response but sheet open - closing sheet");
      setOpenTransactionSheet(false);
    }
  }, [response, openTransactionSheet, processing]);
  
  // Handle dialog state coordination
  useEffect(() => {
    // If dialog closes, make sure we clear the input but only if not processing
    if (!isOpen && !processing) {
      setInput("");
    }
  }, [isOpen, processing]);
  
  // Debug state transitions for easier troubleshooting
  useEffect(() => {
    const states = {
      isOpen,
      openTransactionSheet,
      hasResponse: !!response,
      processing
    };
    console.log("State snapshot:", states);
  }, [isOpen, openTransactionSheet, response, processing]);

  return (
    <>
      {/* AI Assistant Button */}
      <Button
        variant={variant === "magical" ? "default" : variant}
        className={cn(
          "flex items-center gap-1", 
          variant === "magical" 
            ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0"
            : "bg-violet-600 hover:bg-violet-700 text-white",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <SparklesIcon className="h-4 w-4" />
        <span>Trợ lý AI</span>
      </Button>

      {/* AI Assistant Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary" />
              <span>Trợ lý thông minh</span>
            </DialogTitle>
            <DialogDescription>
              Mô tả giao dịch bằng ngôn ngữ tự nhiên và để AI giúp bạn tạo giao dịch
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 overflow-y-auto flex-grow pr-1 mobile-scrollbar">
            <div className="mb-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ví dụ: Hùng trả tiền taxi 200k, chia đều cho mọi người"
                className="w-full min-h-[80px]"
                disabled={processing}
              />
            </div>

            {/* Suggested prompts */}
            {/* Model selector */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-muted-foreground">Mô hình AI:</div>
                {availableProviders.length === 0 && (
                  <Badge variant="destructive" className="text-xs">Cần thêm API key</Badge>
                )}
              </div>
              {isLoadingModels ? (
                <div className="flex items-center justify-center p-4 border rounded-md bg-muted/30">
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-xs">Đang tải mô hình...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableModels.map((model) => {
                    const isAvailable = availableProviders.includes(model.provider as 'google' | 'openai' | 'groq');
                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModelId(model.id)}
                        className={`text-xs px-3 py-3 rounded-md transition-colors border 
                          ${selectedModelId === model.id ? 'bg-primary/10 border-primary/30 text-primary' : ''}
                          ${!isAvailable ? 'opacity-50 cursor-not-allowed bg-muted/10' : 'bg-muted/30 border-border hover:bg-muted'}`}
                        disabled={!isAvailable || processing}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-muted-foreground text-xs truncate">{model.description}</div>
                        {!isAvailable && (
                          <div className="text-destructive text-xs mt-1">
                            Cần API key {model.provider}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {availableProviders.length === 0 && (
                <div className="mt-2 text-xs text-destructive">
                  Vui lòng thêm API key trong cài đặt quỹ để sử dụng trợ lý AI
                </div>
              )}
            </div>

            {/* Usage stats */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground mb-2">Thống kê sử dụng:</div>
                <button
                  onClick={() => setShowApiInfo(!showApiInfo)}
                  className="text-xs text-primary hover:underline"
                >
                  {showApiInfo ? "Ẩn chi tiết" : "Xem chi tiết"}
                </button>
              </div>
              <div className="bg-muted/30 p-3 rounded-md text-sm">
                <div className="flex justify-between mb-1">
                  <span>Hôm nay:</span>
                  <span className="font-medium">{fund.aiUsageStats?.todayCalls || 0} lượt</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng:</span>
                  <span className="font-medium">{fund.aiUsageStats?.totalCalls || 0} lượt</span>
                </div>

                {showApiInfo && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs font-medium mb-2">API Keys:</div>
                    {fund.aiApiKeys && fund.aiApiKeys.length > 0 ? (
                      <div className="space-y-2">
                        {fund.aiApiKeys.map((apiKey) => (
                          <div key={apiKey.id} className="flex items-center justify-between">
                            <div>
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${apiKey.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="text-xs">{apiKey.label}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">{apiKey.provider}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Chưa có API key nào được cấu hình</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2">Gợi ý:</div>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent py-1.5 px-3 text-sm"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description of what AI can do */}
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p>
                <strong>Trợ lý AI</strong> có thể giúp bạn tạo giao dịch nhanh chóng chỉ bằng cách mô tả:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Chi tiết về người trả tiền</li>
                <li>Số tiền của giao dịch</li>
                <li>Cách chia tiền giữa các thành viên</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 bottom-0 pt-3 pb-1 bg-background border-t mt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="h-10 px-4"
            >
              Hủy
            </Button>
            <Button
              onClick={processMessage}
              disabled={!input.trim() || processing}
              className={cn(
                "relative h-10 px-4",
                variant === "magical" ? "bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600" : ""
              )}
            >
              {processing ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  <span>Xử lý bằng AI</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Sheet with Pre-filled Data - always rendered but data only passed when available */}
      <CreateTransactionSheet
        fund={fund}
        initialData={response ? {
          description: response.desc,
          amount: response.totalAmount.toString(),
          splits: fund.members.map(memberId => {
            // Get amount directly using member ID as key in the response
            const amountStr = response.users[memberId];
            const amount = amountStr ? parseInt(amountStr) : 0;
            return { userId: memberId, amount };
          }),
          reasoning: response.reasoning, // Pass the reasoning from AI response
          aiGenerated: true, // Flag to indicate this was generated by AI
          aiPrompt: currentPrompt // Save the original prompt
        } : undefined}
        openSheet={openTransactionSheet}
        onOpenChange={(open) => {
          console.log("Transaction sheet onOpenChange:", open);
          
          // Always update internal state first to avoid re-renders triggering unwanted side effects
          setOpenTransactionSheet(open);
          
          if (!open) {
            console.log("Transaction sheet is closing - cleaning up state");
            // Immediate cleanup of response state to prevent sheet from reopening
            setResponse(null);
            // Clear the prompt as well
            setCurrentPrompt("");
          } else {
            // Sheet is being opened
            console.log("Sheet opened with response data:", response ? "exists" : "null");
          }
        }}
      >
        <button ref={transactionSheetRef} className="hidden">Open Sheet</button>
      </CreateTransactionSheet>
    </>
  );
}
