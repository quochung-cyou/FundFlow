import React from "react";
import { AnimatedCard } from "@/components/ui/feature-block-animated-card";
import { LightbulbIcon, ArrowRightIcon, CoinsIcon, WalletIcon, ArrowLeftRightIcon, ReceiptIcon } from "lucide-react";

interface FundInfoCardProps {
  className?: string;
}

export function FundInfoCard({ className }: FundInfoCardProps) {
  return (
    <AnimatedCard
      className={`bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/40 dark:to-violet-950/40 border-0 shadow-md overflow-hidden max-h-[450px] ${className}`}
      title={
        <span className="text-base font-medium text-blue-800 dark:text-blue-300">
          Hướng dẫn sử dụng
        </span>
      }
      description={
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-blue-900/80 dark:text-blue-100/80">
            Để trả tiền, bạn có thể thanh toán cho bất kỳ thành viên nào đang có số dư dương (màu xanh). Quỹ hoạt động theo nguyên tắc cân bằng: khi bạn trả tiền cho người có số dư dương trong khi bạn đang âm (số đỏ), mọi người sẽ dần cân bằng lại.
          </p>
          <div className="flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            <span>Ví dụ: Nếu A nợ B, B nợ C thì A có thể trả thẳng cho C</span>
            <ArrowRightIcon className="h-3 w-3" />
          </div>
        </div>
      }
      icons={[
        {
          icon: <CoinsIcon className="text-blue-600 dark:text-blue-400" />,
          size: "md",
          className: "bg-blue-100/80 dark:bg-blue-900/30"
        },
        {
          icon: <WalletIcon className="text-violet-600 dark:text-violet-400" />,
          size: "lg",
          className: "bg-violet-100/80 dark:bg-violet-900/30"
        },
        {
          icon: <ArrowLeftRightIcon className="text-blue-600 dark:text-blue-400" />,
          size: "md",
          className: "bg-blue-100/80 dark:bg-blue-900/30"
        },
      ]}
    />
  );
}
