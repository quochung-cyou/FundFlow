import { useState, useRef } from "react";
import { Fund, User, Split } from "@/types";
import { Button } from "@/components/ui/button";
import { SparklesIcon, SendIcon, Loader2Icon, XIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseTransactionWithLLM, LLMTransactionResponse } from "@/services/aiService";
import { CreateTransactionSheet } from "@/components/transactions/CreateTransactionSheet";

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
  const transactionSheetRef = useRef<HTMLButtonElement>(null);
  
  const { createTransaction, getUserById, currentUser } = useApp();
  
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
  
  // Process a message with AI
  const processMessage = async () => {
    if (!input.trim() || processing) return;
    
    setProcessing(true);
    
    try {
      // Call the AI service to parse the transaction with current user context
      const result = await parseTransactionWithLLM(
        input, 
        fund, 
        memberUsers,
        currentUser?.id // Pass current user ID for context
      );
      
      // Set the response and prepare transaction data
      setResponse(result);
      prepareTransactionData(result);
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
  
  // Prepare transaction data from AI response
  const prepareTransactionData = (result: LLMTransactionResponse) => {
    if (!result) return;
    
    try {
      console.log("AI Response:", result);
      
      // Simplify: Only process valid transactions where the payer ID exists
      const payerUser = memberUsers.find(user => user.id === result.payer);
      
      if (!payerUser) {
        toast.error('Không tìm thấy người trả tiền trong quỹ');
        return;
      }
      
      // Keep it simple - if the response has user amounts, use them directly
      // If a user ID is missing, we'll handle it gracefully by assigning 0
      const processedSplits: Split[] = fund.members.map(memberId => {
        const amountStr = result.users[memberId];
        const amount = amountStr ? parseInt(amountStr) : 0;
        return { userId: memberId, amount };
      });
      
      console.log("Processed splits:", processedSplits);
      
      // Clean up response state before changing UI
      setResponse(null);
      
      // First close the AI dialog
      setIsOpen(false);
      setInput("");
      
      // Store the response for the transaction sheet
      setResponse({
        ...result,
        // Make sure we're using the correct values
        payer: payerUser.id,
        desc: result.desc || 'Giao dịch mới'
      });
      
      // Trigger the transaction sheet to open
      // Using a small timeout to ensure React updates the state properly first
      setTimeout(() => {
        setOpenTransactionSheet(true);
      }, 100);
      
      // Display the reasoning from AI (if available) as a toast message
      if (result.reasoning) {
        toast.success('Thông tin giao dịch đã được điền!', {
          description: result.reasoning,
          duration: 6000
        });
      } else {
        toast.success('Thông tin giao dịch đã được điền! Vui lòng kiểm tra và chỉnh sửa nếu cần.');
      }
    } catch (error) {
      console.error('Error preparing transaction data:', error);
      toast.error('Không thể chuẩn bị dữ liệu giao dịch');
    }
  };
  
  // Suggested prompts for quick use
  const suggestedPrompts = [
    "Hôm nay ăn sáng 150k, mọi người chia đều",
    "Hung trả tiền taxi 200k, Huy trả 120k",
    "Tiền mua đồ ăn 500k, chia theo tỉ lệ 2-1-1"
  ];
  
  // Button variants
  const buttonClasses = variant === "magical" 
    ? "bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0"
    : "";
    
  return (
    <>
      {/* AI Assistant Button */}
      <Button
        variant={variant === "magical" ? "default" : variant}
        className={cn("flex items-center gap-1", buttonClasses, className)}
        onClick={() => setIsOpen(true)}
      >
        <SparklesIcon className="h-4 w-4" />
        <span>Trợ lý AI</span>
      </Button>
      
      {/* AI Assistant Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary" />
              <span>Trợ lý thông minh</span>
            </DialogTitle>
            <DialogDescription>
              Mô tả giao dịch bằng ngôn ngữ tự nhiên và để AI giúp bạn tạo giao dịch
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ví dụ: Hùng trả tiền taxi 200k, chia đều cho mọi người"
                className="w-full"
                disabled={processing}
              />
            </div>
            
            {/* Suggested prompts */}
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2">Gợi ý:</div>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="cursor-pointer hover:bg-accent"
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={processMessage} 
              disabled={!input.trim() || processing}
              className={cn(
                "relative",
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
          reasoning: response.reasoning // Pass the reasoning from AI response
        } : undefined}
        openSheet={openTransactionSheet}
        onOpenChange={(open) => {
          console.log("Sheet open state changed to:", open);
          // Reset the openTransactionSheet state when the sheet is closed
          if (!open) {
            setOpenTransactionSheet(false);
          }
        }}
      >
        <button ref={transactionSheetRef} className="hidden">Open Sheet</button>
      </CreateTransactionSheet>
    </>
  );
}
