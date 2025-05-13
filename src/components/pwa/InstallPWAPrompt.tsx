import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // Check if it's an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(isIOS);

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    // Don't show prompt if already installed
    if (isInstalled) return;

    // Store the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if we should show iOS instructions
    if (isIOS && !isInstalled) {
      // Only show iOS instructions if not in standalone mode
      const visited = localStorage.getItem('iosInstallPromptShown');
      if (!visited) {
        setIsVisible(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setInstallPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Error during installation:', error);
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
    <Card className="w-full max-w-md mx-auto shadow-lg border-primary/10 animate-in fade-in-50 duration-300">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            Install Fund Flow App
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {isIOSDevice 
            ? 'Install this app on your iOS device for a better experience'
            : 'Install this app on your device for faster access and a better experience'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isIOSDevice ? (
          <div className="space-y-2 text-sm">
            <p>To install on your iOS device:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tap the share icon <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">􀈂</span> at the bottom of the screen</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> in the top-right corner</li>
            </ol>
          </div>
        ) : (
          <p className="text-sm">
            Install this application on your device to use it even when you're offline.
            It won't take up much space and you can uninstall it anytime.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDismiss}>
          Maybe Later
        </Button>
        {!isIOSDevice && installPrompt && (
          <Button onClick={handleInstall} className="gap-2">
            Install Now
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
