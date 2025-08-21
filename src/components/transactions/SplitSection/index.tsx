import { useState } from "react";
import { MemberSplitList } from "./MemberSplitList";
import { ParticipantSelectionPopup } from "./ParticipantSelectionPopup";

interface User {
  id: string;
  displayName: string;
  photoURL?: string;
}

interface SplitSectionProps {
  memberUsers: User[];
  splits: { userId: string; amount: number }[];
  amount: string;
  distributeEvenly: () => void;
  handleUpdateSplit: (userId: string, amount: number) => void;
  currentUserId?: string;
  currency?: { code: string; name: string; symbol: string; flag?: string };
  convertedAmount?: number | null;
}

export function SplitSection({
  memberUsers,
  splits,
  amount,
  distributeEvenly,
  handleUpdateSplit,
  currentUserId,
  currency,
  convertedAmount
}: SplitSectionProps) {
  // Debug log for currency and amount
  console.log("SplitSection received:", { 
    currency, 
    convertedAmount, 
    amount,
    currencyCode: currency?.code
  });
  // Check if amount is valid
  const isAmountValid = !!amount && parseInt(amount) > 0;
  const [isParticipantPopupOpen, setIsParticipantPopupOpen] = useState(false);
  
  // Function to distribute amount evenly with current user paying
  const distributeWithCurrentUserPaying = (selectedParticipantIds: string[]) => {
    if (!isAmountValid || !currentUserId) return;
    
    console.log("distributeWithCurrentUserPaying - Before conversion:", {
      amount,
      currencyCode: currency?.code,
      convertedAmount
    });
    
    // Use converted amount for foreign currency
    let totalAmount = parseInt(amount);
    
    // If we have a foreign currency but no conversion rate yet, don't proceed
    if (currency?.code !== "VND" && convertedAmount === null) {
      console.log("Cannot distribute yet - waiting for conversion rate");
      return;
    }
    
    // Use converted amount if available and not VND
    if (currency?.code !== "VND" && convertedAmount) {
      console.log("Using converted amount for foreign currency:", convertedAmount);
      totalAmount = convertedAmount;
    } else {
      console.log("Using original amount (VND or no conversion):", totalAmount);
    }
    
    console.log("Final amount for distribution:", totalAmount);
    
    const participantCount = selectedParticipantIds.length;
    
    if (participantCount === 0) return;
    
    // Calculate individual share
    const individualShare = Math.floor(totalAmount / participantCount);
    
    // Reset all splits first
    memberUsers.forEach(member => {
      handleUpdateSplit(member.id, 0);
    });
    
    // Apply negative amounts to selected participants except current user
    selectedParticipantIds.forEach(userId => {
      if (userId !== currentUserId) {
        handleUpdateSplit(userId, -individualShare);
      }
    });
    
    // Calculate how much the current user should receive
    const totalNegative = individualShare * (participantCount - (selectedParticipantIds.includes(currentUserId) ? 1 : 0));
    if (selectedParticipantIds.includes(currentUserId)) {
      handleUpdateSplit(currentUserId, totalNegative);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center top-0 z-10 bg-background pb-1">
        <div className="text-sm font-medium">Chia tiền</div>
        <div className="flex gap-2">
          <button 
            type="button"
            className="text-xs px-3 py-1 rounded-md border hover:bg-accent/50"
            onClick={distributeEvenly}
            disabled={!isAmountValid}
          >
            Chia đều
          </button>
          <button 
            type="button"
            className="text-xs px-3 py-1 rounded-md border hover:bg-accent/50"
            onClick={() => setIsParticipantPopupOpen(true)}
            disabled={!isAmountValid || !currentUserId}
          >
            Chia đều chọn lọc
          </button>
        </div>
      </div>
      
      <MemberSplitList
        memberUsers={memberUsers}
        splits={splits}
        isAmountValid={isAmountValid}
        handleUpdateSplit={handleUpdateSplit}
      />
      
      {currentUserId && (
        <ParticipantSelectionPopup
          isOpen={isParticipantPopupOpen}
          onClose={() => setIsParticipantPopupOpen(false)}
          memberUsers={memberUsers}
          currentUserId={currentUserId}
          onConfirm={distributeWithCurrentUserPaying}
          currency={currency}
          convertedAmount={convertedAmount}
        />
      )}
    </div>
  );
}
