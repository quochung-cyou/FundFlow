import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon, XIcon } from "lucide-react";

interface SplitAmountEditorProps {
  editingSplitValue: string;
  handleEditingSplitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleSplitValueSign: () => void;
  saveEditingSplit: () => void;
  cancelEditingSplit: () => void;
}

export function SplitAmountEditor({
  editingSplitValue,
  handleEditingSplitChange,
  toggleSplitValueSign,
  saveEditingSplit,
  cancelEditingSplit
}: SplitAmountEditorProps) {
  const isNegative = editingSplitValue.startsWith('-');

  return (
    <div className="flex flex-col items-center h-auto py-1">
      <div className={`relative w-full ${isNegative ? 'bg-rose-50 dark:bg-rose-950/20' : ''}`}>
        {isNegative && (
          <div className="absolute left-2 top-0 bottom-0 flex items-center">
            <span className="text-rose-500 font-bold">-</span>
          </div>
        )}
        <Input
          type="text"
          value={isNegative ? editingSplitValue.substring(1) : editingSplitValue}
          onChange={handleEditingSplitChange}
          className={`h-12 text-center text-sm p-1 mb-2 font-medium ${isNegative ? 'text-rose-600 dark:text-rose-400' : ''}`}
          autoFocus
          inputMode="numeric"
          style={{ fontSize: '1.1rem' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveEditingSplit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancelEditingSplit();
            }
          }}
        />
      </div>
      <div className="flex justify-center w-full mt-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-10 px-3"
          onClick={toggleSplitValueSign}
        >
          <span className="text-xs">{isNegative ? "+" : "-"}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-10 px-4"
          onClick={saveEditingSplit}
        >
          <CheckIcon className="h-3 w-3 text-emerald-500 mr-1" />
          <span className="text-xs">Lưu</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-10 px-4"
          onClick={cancelEditingSplit}
        >
          <XIcon className="h-3 w-3 text-rose-500 mr-1" />
          <span className="text-xs">Hủy</span>
        </Button>
      </div>
    </div>
  );
}
