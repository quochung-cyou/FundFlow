import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  // useEffect(() => {
  //   // Check if it's an iOS device
  //   const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  //   setIsIOSDevice(isIOS);

  //   // Check if already installed
  //   const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
  //                       (window.navigator as any).standalone === true;
    
  //   // Don't show prompt if already installed
  //   if (isInstalled) return;

  //   // Store the install prompt event
  //   const handleBeforeInstallPrompt = (e: Event) => {
  //     e.preventDefault();
  //     setInstallPrompt(e as BeforeInstallPromptEvent);
  //     setIsVisible(true);
  //   };

  //   window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  //   // Check if we should show iOS instructions
  //   if (isIOS && !isInstalled) {
  //     // Only show iOS instructions if not in standalone mode
  //     const visited = localStorage.getItem('iosInstallPromptShown');
  //     if (!visited) {
  //       setIsVisible(true);
  //     }
  //   }

  //   return () => {
  //     window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  //   };
  // }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('Người dùng đã chấp nhận lời nhắc cài đặt');
      } else {
        console.log('Người dùng đã từ chối lời nhắc cài đặt');
      }
      
      setInstallPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Lỗi trong quá trình cài đặt:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    
    // For iOS, remember that we've shown the prompt
    if (isIOSDevice) {
      localStorage.setItem('iosInstallPromptShown', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay with blur effect */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={handleDismiss}
        aria-hidden="true"
      />
      
      {/* Prompt card positioned at the top */}
      <div className="fixed inset-x-0 top-0 z-50 p-4 flex justify-center items-start">
        <Card className="w-full max-w-md shadow-lg border-primary/10 animate-in fade-in-50 slide-in-from-top-5 duration-300">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            Cài đặt Ứng dụng Để Tui Trả
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {isIOSDevice 
            ? 'Cài đặt ứng dụng này trên thiết bị iOS của bạn để có trải nghiệm tốt hơn'
            : 'Cài đặt ứng dụng này trên thiết bị của bạn để truy cập nhanh hơn và có trải nghiệm tốt hơn'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isIOSDevice ? (
          <div className="space-y-2 text-sm">
            <p>Để cài đặt trên thiết bị iOS của bạn:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Nhấn vào biểu tượng chia sẻ <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">􀈂</span> ở cuối màn hình</li>
              <li>Cuộn xuống và nhấn <strong>"Thêm vào Màn hình chính"</strong></li>
              <li>Nhấn <strong>"Thêm"</strong> ở góc trên bên phải</li>
            </ol>
          </div>
        ) : (
          <p className="text-sm">
            Cài đặt ứng dụng này trên thiết bị của bạn để sử dụng ngay cả khi bạn ngoại tuyến.
            Ứng dụng sẽ không chiếm nhiều dung lượng và bạn có thể gỡ cài đặt bất cứ lúc nào.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDismiss}>
          Để sau
        </Button>
        {!isIOSDevice && installPrompt && (
          <Button onClick={handleInstall} className="gap-2">
            Cài đặt ngay
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
        </Card>
      </div>
      
      {/* Easy close button at bottom of screen on mobile */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center md:hidden">
        <Button 
          onClick={handleDismiss}
          variant="secondary" 
          className="rounded-full shadow-lg px-6 py-6 h-auto font-medium bg-background/80 backdrop-blur-sm border border-input"
        >
          Đóng
        </Button>
      </div>
    </>
  );
}