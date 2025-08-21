import { Button } from "@/components/ui/button";

interface QuickAmountButtonsProps {
  setPresetAmount: (amount: number) => void;
}

export function QuickAmountButtons({ setPresetAmount }: QuickAmountButtonsProps) {
  const presets = [
    { value: 10000, label: "10.000" },
    { value: 50000, label: "50.000" },
    { value: 100000, label: "100.000" },
    { value: 200000, label: "200.000" },
    { value: 500000, label: "500.000" },
    { value: 1000000, label: "1 triệu" },
    { value: 2000000, label: "2 triệu" },
    { value: 5000000, label: "5 triệu" }
  ];

  // First row of buttons
  const firstRow = presets.slice(0, 4);
  // Second row of buttons
  const secondRow = presets.slice(4);

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {firstRow.map((preset) => (
          <Button 
            key={preset.value}
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setPresetAmount(preset.value)}
            className="text-xs h-8"
          >
            {preset.label}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-4 gap-2 mt-1">
        {secondRow.map((preset) => (
          <Button 
            key={preset.value}
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setPresetAmount(preset.value)}
            className="text-xs h-8"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </>
  );
}
