import { MemberSplitItem } from "./MemberSplitItem";

interface User {
  id: string;
  displayName: string;
  photoURL?: string;
}

interface MemberSplitListProps {
  memberUsers: User[];
  splits: { userId: string; amount: number }[];
  isAmountValid: boolean;
  handleUpdateSplit: (userId: string, amount: number) => void;
}

export function MemberSplitList({
  memberUsers,
  splits,
  isAmountValid,
  handleUpdateSplit
}: MemberSplitListProps) {
  return (
    <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1 pb-6 pt-2">
      {memberUsers.map((member) => {
        const splitAmount = splits.find(s => s.userId === member.id)?.amount || 0;
        
        return (
          <MemberSplitItem
            key={member.id}
            member={member}
            amount={splitAmount}
            isAmountValid={isAmountValid}
            handleUpdateSplit={handleUpdateSplit}
          />
        );
      })}
    </div>
  );
}
