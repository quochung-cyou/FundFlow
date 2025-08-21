import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UtensilsIcon, WalletIcon, MapPinIcon } from "lucide-react";

interface DescriptionInputProps {
  description: string;
  setDescription: (value: string) => void;
  validateForm: (options: { showErrors: boolean }) => boolean;
}

export function DescriptionInput({ 
  description, 
  setDescription, 
  validateForm 
}: DescriptionInputProps) {
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    // Validate after a short delay to avoid excessive validation during typing
    setTimeout(() => {
      validateForm({ showErrors: false });
    }, 500);
  };

  const handleQuickFilterSelect = (preset: string) => {
    setDescription(preset);
    descriptionInputRef.current?.focus();
  };
  
  // Get current date in DD/MM format
  const getCurrentDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };
  
  // Create date-based descriptions
  const currentDate = getCurrentDate();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center sticky top-0 z-10 bg-background pb-1">
        <Label htmlFor="description">Mô tả</Label>
      </div>
      <div className="relative">
        <Input
          id="description"
          placeholder="Nhập mô tả giao dịch"
          value={description}
          onChange={handleDescriptionChange}
          ref={descriptionInputRef}
        />
      </div>
      
      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mt-2">
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-accent flex items-center gap-1 py-1 px-2"
          onClick={() => handleQuickFilterSelect(`Chia tiền ngày ${currentDate}`)}
        >
          <WalletIcon className="h-3 w-3" />
          <span>Chia tiền ngày {currentDate}</span>
        </Badge>
        
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-accent flex items-center gap-1 py-1 px-2"
          onClick={() => handleQuickFilterSelect(`Tiền ăn ngày ${currentDate}`)}
        >
          <UtensilsIcon className="h-3 w-3" />
          <span>Tiền ăn ngày {currentDate}</span>
        </Badge>
        
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-accent flex items-center gap-1 py-1 px-2"
          onClick={() => handleQuickFilterSelect(`Đi chơi ngày ${currentDate}`)}
        >
          <MapPinIcon className="h-3 w-3" />
          <span>Đi chơi ngày {currentDate}</span>
        </Badge>
        
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-accent flex items-center gap-1 py-1 px-2"
          onClick={() => handleQuickFilterSelect(`Tiền cà phê ngày ${currentDate}`)}
        >
          <CalendarIcon className="h-3 w-3" />
          <span>Tiền cà phê ngày {currentDate}</span>
        </Badge>
      </div>
    </div>
  );
}
