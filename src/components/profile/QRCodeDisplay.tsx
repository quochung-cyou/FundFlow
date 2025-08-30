import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateQRCodeUrl } from "@/services/bankService";
import { User } from "@/types";
import { BankDeepLinkButton } from "@/components/profile/BankDeepLinkButton";

interface QRCodeDisplayProps {
  user: User;
  amount?: number;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeDisplay({ user, amount, description, isOpen, onClose }: Readonly<QRCodeDisplayProps>) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!user.bankAccount) {
    return null;
  }

  const { bankCode, accountNumber, bankName, accountName } = user.bankAccount;
  const qrUrl = generateQRCodeUrl(
    bankCode,
    accountNumber,
    amount,
    description,
    accountName || user.displayName,
    'print'
  );

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã copy ${label}`);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error("Không thể copy");
    }
  };

  const downloadQRCode = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_${user.displayName}_${accountNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Đã tải xuống QR code");
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error("Không thể tải xuống QR code");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mã QR chuyển tiền</DialogTitle>
          <DialogDescription>
            Quét mã để chuyển tiền cho {user.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Image */}
          <div className="flex justify-center">
            <div className="relative bg-white p-2 rounded-lg border">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <img
                src={qrUrl}
                alt="QR Code"
                className="max-w-full h-auto"
                onLoad={() => setIsLoading(false)}
                onError={(e) => {
                  setIsLoading(false);
                  (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjczODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+S2jDtG5nIHRo4buDIHThuqNpIFFSIGNvZGU8L3RleHQ+PC9zdmc+";
                }}
              />
            </div>
          </div>

          {/* Bank Information */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ngân hàng:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{bankName}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(bankName, "tên ngân hàng")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{accountNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(accountNumber, "số tài khoản")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Chủ tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{accountName || user.displayName}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(accountName || user.displayName, "tên chủ tài khoản")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {Boolean(amount) && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Số tiền:</span>
                <span className="text-sm font-medium text-green-600">
                  {new Intl.NumberFormat('vi-VN').format(amount)} VND
                </span>
              </div>
            )}

            {description && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Nội dung:</span>
                <div className="flex items-center gap-2 max-w-[200px]">
                  <span className="text-sm truncate">{description}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => copyToClipboard(description, "nội dung chuyển tiền")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={downloadQRCode}
              disabled={isDownloading || isLoading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Tải xuống
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => copyToClipboard(qrUrl, "link QR code")}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy link
            </Button>
          </div>

          {/* Bank Deep Link Button */}
          <BankDeepLinkButton />
        </div>
      </DialogContent>
    </Dialog>
  );
}
