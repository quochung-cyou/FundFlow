import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SplitHeaderProps {
  distributeEvenly: () => void;
  isAmountValid: boolean;
}

export function SplitHeader({ distributeEvenly, isAmountValid }: SplitHeaderProps) {
  return (
    <div className="flex justify-between items-center top-0 z-10 bg-background pb-1">
      <Label>Chia tiền</Label>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={distributeEvenly}
        disabled={!isAmountValid}
      >
        Chia đều
      </Button>
    </div>
  );
}
