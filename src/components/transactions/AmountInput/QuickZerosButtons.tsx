import { Button } from "@/components/ui/button";

interface QuickZerosButtonsProps {
  addZeros: (count: number) => void;
}

export function QuickZerosButtons({ addZeros }: QuickZerosButtonsProps) {
  const zeroOptions = [
    { count: 3, label: "+ 000" },
    { count: 4, label: "+ 0000" },
    { count: 5, label: "+ 00000" }
  ];

  return (
    <div className="flex gap-2 mt-1">
      {zeroOptions.map((option) => (
        <Button 
          key={option.count}
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => addZeros(option.count)}
          className="flex-1 text-xs h-8"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
