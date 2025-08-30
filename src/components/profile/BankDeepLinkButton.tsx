import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

interface BankApp {
  appId: string;
  appLogo: string;
  appName: string;
  bankName: string;
  monthlyInstall: number;
  deeplink: string;
  autofill: number;
}

interface BankAppsResponse {
  apps: BankApp[];
}

export function BankDeepLinkButton() {
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [userBankApp, setUserBankApp] = useState<BankApp | null>(null);

  // Check if user has bank account info
  const hasBankAccount = currentUser?.bankAccount?.bankName && currentUser?.bankAccount?.accountNumber;

  // Detect platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  // Load bank apps from API
  useEffect(() => {
    console.log('BankDeepLinkButton: Checking conditions to load bank apps...');
    console.log('BankDeepLinkButton: hasBankAccount=', hasBankAccount, 'isMobile=', isMobile, 'isIOS=', isIOS, 'isAndroid=', isAndroid);
    if (!hasBankAccount || !isMobile) return;

    const loadBankApps = async () => {
      setIsLoading(true);
      try {
        const apiUrl = isIOS 
          ? 'https://api.vietqr.io/v2/ios-app-deeplinks'
          : 'https://api.vietqr.io/v2/android-app-deeplinks';
        
        console.log('BankDeepLinkButton: Loading bank apps from', apiUrl);
        const response = await fetch(apiUrl);
        const data: BankAppsResponse = await response.json();
        console.log('BankDeepLinkButton: Loaded bank apps:', data.apps?.length || 0);

        // Try to find matching bank app based on user's bank code first, then bank name
        if (currentUser?.bankAccount) {
          let matchingApp: BankApp | undefined;
          
          console.log('BankDeepLinkButton: User bank account:', {
            bankCode: currentUser.bankAccount.bankCode,
            bankName: currentUser.bankAccount.bankName
          });
          
          // Try to match by bank code first (more reliable)
          if (currentUser.bankAccount.bankCode) {
            matchingApp = data.apps.find(app => 
              app.appId.toLowerCase() === currentUser.bankAccount.bankCode.toLowerCase()
            );
            console.log('BankDeepLinkButton: Match by bank code:', matchingApp?.appName || 'Not found');
          }
          
          // If no match by bank code, try to match by bank name
          if (!matchingApp && currentUser.bankAccount.bankName) {
            matchingApp = data.apps.find(app => 
              app.bankName.toLowerCase().includes(currentUser.bankAccount.bankName.toLowerCase()) ||
              currentUser.bankAccount.bankName.toLowerCase().includes(app.bankName.toLowerCase())
            );
            console.log('BankDeepLinkButton: Match by bank name:', matchingApp?.appName || 'Not found');
          }
          
          setUserBankApp(matchingApp || null);
        }
      } catch (error) {
        console.error('BankDeepLinkButton: Error loading bank apps:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBankApps();
  }, [hasBankAccount, isMobile, isIOS, currentUser?.bankAccount?.bankCode, currentUser?.bankAccount?.bankName]);

  // Don't show if user doesn't have bank account or not on mobile
  if (!hasBankAccount || !isMobile) {
    return null;
  }

  const handleOpenBankApp = () => {
    if (userBankApp) {
      window.open(userBankApp.deeplink, '_blank');
    }
  };

  return (
    <div className="mt-4">
      {isLoading && (
        <Button variant="outline" disabled className="w-full">
          <Smartphone className="h-4 w-4 mr-2" />
          Đang tải...
        </Button>
      )}
      
      {!isLoading && userBankApp && (
        <Button 
          variant="outline" 
          onClick={handleOpenBankApp}
          className="w-full hover:bg-blue-50 border-blue-200 text-blue-700"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Mở ngân hàng của bạn để chuyển tiền
        </Button>
      )}
      
      {!isLoading && !userBankApp && (
        <Button variant="outline" disabled className="w-full opacity-50">
          <Smartphone className="h-4 w-4 mr-2" />
          Không tìm thấy ứng dụng ngân hàng
        </Button>
      )}
      
      {userBankApp && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Sẽ mở ứng dụng {userBankApp.appName}
        </p>
      )}
    </div>
  );
}
