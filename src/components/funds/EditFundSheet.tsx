import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { useState, ReactNode } from "react";
import { Fund } from "@/types";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";

// Same icons as in CreateFundForm
const icons = ["💰", "🍽️", "🏠", "🏖️", "🎮", "🎬", "🚗", "🎁", "🏋️", "📚", "🛒", "👕"];

interface EditFundSheetProps {
  fund: Fund;
  children: ReactNode;
}

export function EditFundSheet({ fund, children }: EditFundSheetProps) {
  // State for form fields
  const [name, setName] = useState(fund.name);
  const [description, setDescription] = useState(fund.description || "");
  const [selectedIcon, setSelectedIcon] = useState(fund.icon);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { funds, setSelectedFund } = useApp();

  // Access the updateFund function from the context
  const { updateFund } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update the fund in Firebase
      await updateFund(fund.id, {
        name,
        description,
        icon: selectedIcon,
      });

      // Update the selected fund in the local state
      const updatedFund = {
        ...fund,
        name,
        description,
        icon: selectedIcon,
      };
      
      setSelectedFund(updatedFund);
      
      // Close the sheet
      setIsOpen(false);
      toast.success("Cập nhật quỹ thành công!");
    } catch (error) {
      console.error("Error updating fund:", error);
      toast.error("Không thể cập nhật quỹ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form values when the sheet opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setName(fund.name);
      setDescription(fund.description || "");
      setSelectedIcon(fund.icon);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Chỉnh sửa quỹ</SheetTitle>
            <SheetDescription>
              Cập nhật thông tin của quỹ
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="name">Tên quỹ</Label>
              <Input
                id="name"
                placeholder="Nhập tên quỹ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Nhập mô tả về quỹ này"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {icons.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant={selectedIcon === icon ? "default" : "outline"}
                    className="h-12 w-12 text-2xl relative"
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                    {selectedIcon === icon && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </SheetClose>
            <Button 
              type="submit" 
              disabled={!name || isLoading}
              className={isLoading ? "opacity-70" : ""}
            >
              {isLoading ? "Đang cập nhật..." : "Lưu thay đổi"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
