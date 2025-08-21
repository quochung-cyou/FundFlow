import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface TransactionSheetHeaderProps {
  fundName: string;
}

export function TransactionSheetHeader({ fundName }: TransactionSheetHeaderProps) {
  return (
    <div className="px-6 pt-6 pb-2 border-b">
      <SheetHeader>
        <SheetTitle>Thêm giao dịch mới</SheetTitle>
        <SheetDescription>
          Thêm một khoản chi tiêu mới vào quỹ {fundName}
        </SheetDescription>
      </SheetHeader>
    </div>
  );
}
