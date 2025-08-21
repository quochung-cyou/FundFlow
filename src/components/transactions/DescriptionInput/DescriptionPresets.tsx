interface DescriptionPresetsProps {
  onSelect: (preset: string) => void;
  onClose: () => void;
}

export function DescriptionPresets({ onSelect, onClose }: DescriptionPresetsProps) {
  const presets = [
    "Trả nợ",
    "Chia tiền ăn trưa",
    "Chia tiền ăn sáng",
    "Chia tiền ăn tối",
    "Tiền xăng xe",
    "Tiền taxi/grab",
    "Tiền cà phê",
    "Tiền đi chợ",
    "Tiền điện nước",
    "Tiền thuê nhà",
    "Tiền mua sắm",
    "Tiền giải trí"
  ];

  return (
    <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg p-2 space-y-1">
      <div className="text-xs font-medium text-muted-foreground mb-2">Chọn mô tả phổ biến:</div>
      {presets.map((preset) => (
        <div 
          key={preset} 
          className="p-2 text-sm hover:bg-accent rounded-md cursor-pointer"
          onClick={() => {
            onSelect(preset);
            onClose();
          }}
        >
          {preset}
        </div>
      ))}
    </div>
  );
}
