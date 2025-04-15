import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Fund } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteFundDialogProps {
  fund: Fund;
  children?: React.ReactNode;
}

export function DeleteFundDialog({ fund, children }: DeleteFundDialogProps) {
  const { deleteFund } = useApp();
  const navigate = useNavigate();

  const handleDelete = async () => {
    const success = await deleteFund(fund.id);
    if (success) {
      navigate("/");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children || (
          <Button variant="destructive" size="sm" className="gap-1">
            <Trash2 className="h-4 w-4" />
            <span>Xóa quỹ</span>
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa quỹ?</AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-3">
              Bạn có chắc chắn muốn xóa quỹ <strong>"{fund.name}"</strong> không? 
            </p>
            <p className="mb-3">
              Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan đến quỹ này.
            </p>
            <p className="font-semibold text-destructive">
              Vui lòng xác nhận lại quyết định của bạn.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Xác nhận xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
