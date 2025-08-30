import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CreditCard, Save, Download } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { fetchVietnameseBanks, Bank, generateQRCodeUrl } from "@/services/bankService";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { User } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { QRCodeDisplay } from "./QRCodeDisplay";

interface BankAccountButtonProps {
  trigger?: React.ReactNode;
}

export function BankAccountButton({ trigger }: Readonly<BankAccountButtonProps>) {
  const { currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [qrImageLoading, setQrImageLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [accountNumber, setAccountNumber] = useState(currentUser?.bankAccount?.accountNumber || "");
  const [selectedBankCode, setSelectedBankCode] = useState(currentUser?.bankAccount?.bankCode || "");
  const [accountName, setAccountName] = useState(currentUser?.bankAccount?.accountName || currentUser?.displayName || "");

  // Load banks and current user data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !currentUser) return;
      
      setIsLoading(true);
      try {
        // Load banks
        const bankData = await fetchVietnameseBanks();
        setBanks(bankData);

        // Fetch fresh user data from Firestore
        const userRef = doc(db, "users", currentUser.id);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const freshUserData: User = {
            id: userDoc.id,
            displayName: userData.displayName || currentUser.displayName,
            email: userData.email || currentUser.email,
            photoURL: userData.photoURL || currentUser.photoURL,
            bankAccount: userData.bankAccount || undefined,
          };
          setCurrentUserData(freshUserData);
          
          // Update form fields with fresh data
          setDisplayName(freshUserData.displayName);
          setAccountNumber(freshUserData.bankAccount?.accountNumber || "");
          setSelectedBankCode(freshUserData.bankAccount?.bankCode || "");
          setAccountName(freshUserData.bankAccount?.accountName || freshUserData.displayName);
        } else {
          // Use current user data if no Firestore document exists
          setCurrentUserData(currentUser);
          setDisplayName(currentUser.displayName);
          setAccountNumber("");
          setSelectedBankCode("");
          setAccountName(currentUser.displayName);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Không thể tải dữ liệu");
        // Fallback to current user data
        setCurrentUserData(currentUser);
        setDisplayName(currentUser.displayName);
        setAccountNumber("");
        setSelectedBankCode("");
        setAccountName(currentUser.displayName);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, currentUser]);

  // Reset form when user changes or sheet closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form state when sheet closes
      setDisplayName(currentUser?.displayName || "");
      setAccountNumber("");
      setSelectedBankCode("");
      setAccountName("");
      setCurrentUserData(null);
    }
  }, [isOpen, currentUser]);

  // Set QR loading state when bank account data changes
  useEffect(() => {
    if (currentUserData?.bankAccount) {
      setQrImageLoading(true);
    }
  }, [currentUserData?.bankAccount]);

  const selectedBank = banks.find(bank => bank.code === selectedBankCode);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã copy ${label}`);
    } catch (error) {
      toast.error("Không thể copy");
    }
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove all non-digit characters
    value = value.replace(/[^\d]/g, "");
    setAccountNumber(value);
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error("Không tìm thấy thông tin người dùng");
      return;
    }

    // Skip display name validation since it's disabled
    // if (!displayName.trim()) {
    //   toast.error("Vui lòng nhập tên hiển thị");
    //   return;
    // }

    // If bank is selected, account number is required
    if (selectedBankCode && !accountNumber.trim()) {
      toast.error("Vui lòng nhập số tài khoản khi đã chọn ngân hàng");
      return;
    }

    // If account number is provided, bank must be selected
    if (accountNumber.trim() && !selectedBankCode) {
      toast.error("Vui lòng chọn ngân hàng khi đã nhập số tài khoản");
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", currentUser.id);
      
      const updateData: Record<string, unknown> = {
        // Don't update display name since it's disabled
        // displayName: displayName.trim(),
        updatedAt: Date.now(),
      };

      // Only include bank account if both bank and account number are provided
      if (selectedBankCode && accountNumber.trim()) {
        updateData.bankAccount = {
          accountNumber: accountNumber.trim(),
          bankCode: selectedBankCode,
          bankName: selectedBank?.name || "",
          accountName: accountName.trim() || currentUser.displayName,
        };
      } else {
        // Remove bank account if incomplete
        updateData.bankAccount = null;
      }

      await updateDoc(userRef, updateData);
      
      toast.success("Cập nhật thông tin thành công");
      setIsOpen(false);
      // Note: Page will need to be refreshed to see changes or we need to update the context
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error("Không thể cập nhật thông tin");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!currentUserData?.bankAccount) return;

    try {
      const qrUrl = generateQRCodeUrl(
        currentUserData.bankAccount.bankCode,
        currentUserData.bankAccount.accountNumber,
        undefined,
        undefined,
        currentUserData.bankAccount.accountName || currentUserData.displayName,
        'compact2'
      );

      // Create a temporary link element to download the image
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `QR_${currentUserData.bankAccount.bankName}_${currentUserData.bankAccount.accountNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Đã tải xuống mã QR");
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.error("Không thể tải xuống mã QR");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white">
            <CreditCard className="h-4 w-4" />
            <span>STK ngân hàng</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Thông tin cá nhân</SheetTitle>
          <SheetDescription>
            Cập nhật tên hiển thị và thông tin tài khoản ngân hàng
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6 px-1">
          {/* Current user info */}
          {currentUserData && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-12 w-12">
                <AvatarImage src={currentUserData.photoURL} alt={currentUserData.displayName} />
                <AvatarFallback>{currentUserData.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{currentUserData.displayName}</div>
                <div className="text-sm text-muted-foreground">{currentUserData.email}</div>
              </div>
            </div>
          )}

          {/* Display name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Tên hiển thị *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên hiển thị"
              required
              disabled={true}
              className="opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Bank selection */}
          <div className="space-y-2">
            <Label htmlFor="bank">Ngân hàng</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Đang tải danh sách ngân hàng...</span>
              </div>
            ) : (
              <Select value={selectedBankCode} onValueChange={setSelectedBankCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngân hàng (không bắt buộc)" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={bank.logo} 
                          alt={bank.shortName}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span>{bank.shortName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Account number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">
              Số tài khoản
              {selectedBankCode && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              placeholder="Nhập số tài khoản"
              inputMode="numeric"
              disabled={!selectedBankCode}
            />
            {!selectedBankCode && (
              <p className="text-xs text-muted-foreground">
                Chọn ngân hàng trước để nhập số tài khoản
              </p>
            )}
          </div>

          {/* Account name */}
          {selectedBankCode && accountNumber && (
            <div className="space-y-2">
              <Label htmlFor="accountName">Tên chủ tài khoản</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Tên chủ tài khoản (sẽ hiển thị trên QR code)"
              />
            </div>
          )}

          {/* Bank account info and QR code preview */}
          {currentUserData?.bankAccount && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-green-800">Thông tin tài khoản hiện tại:</h4>
              </div>
              
              {/* Bank account details */}
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ngân hàng:</span>
                  <div className="flex items-center gap-2">
                    <span>{currentUserData.bankAccount.bankName}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(currentUserData.bankAccount?.bankName || "", "tên ngân hàng")}
                    >
                      📋
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Số TK:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{currentUserData.bankAccount.accountNumber}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(currentUserData.bankAccount?.accountNumber || "", "số tài khoản")}
                    >
                      📋
                    </Button>
                  </div>
                </div>
                {currentUserData.bankAccount.accountName && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tên TK:</span>
                    <div className="flex items-center gap-2">
                      <span>{currentUserData.bankAccount.accountName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(currentUserData.bankAccount?.accountName || "", "tên chủ tài khoản")}
                      >
                        📋
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <div className="relative">
                    {qrImageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <img
                      src={generateQRCodeUrl(
                        currentUserData.bankAccount.bankCode,
                        currentUserData.bankAccount.accountNumber,
                        undefined,
                        undefined,
                        currentUserData.bankAccount.accountName || currentUserData.displayName,
                        'compact2'
                      )}
                      alt="QR Code"
                      className="max-w-[200px] h-auto"
                      onLoad={() => setQrImageLoading(false)}
                      onError={(e) => {
                        setQrImageLoading(false);
                        (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjczODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+S2jDtG5nIHRo4buDIHThuqNpIFFSIGNvZGU8L3RleHQ+PC9zdmc+";
                      }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Mã QR chuyển tiền
                  </p>
                </div>
              </div>

              {/* Download QR Code button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={handleDownloadQR}
                disabled={isSaving}
              >
                <Download className="h-3 w-3 mr-1" />
                Tải xuống mã QR
              </Button>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-between gap-2 pt-4 border-t bg-background">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </SheetContent>

      {/* QR Code Display for current user's bank account */}
      {currentUserData?.bankAccount && (
        <QRCodeDisplay
          user={currentUserData}
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </Sheet>
  );
}
