import { useEffect, useState } from 'react';
import { registerServiceWorker, isPushNotificationSupported, isPushNotificationPermitted } from '@/utils/pwaUtils';
import { NotificationPermission } from './NotificationPermission';

interface PWAInitializerProps {
  autoAskPermission?: boolean;
  delayPermissionPrompt?: number; // Delay in milliseconds
}

export function PWAInitializer({ 
  autoAskPermission = true,
  delayPermissionPrompt = 3000 // Default 3 seconds
}: PWAInitializerProps) {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize PWA and service worker
  useEffect(() => {
    const initializePWA = async () => {
      try {
        // Register service worker
        const registration = await registerServiceWorker();
        
        if (registration) {
          console.log('PWA initialized successfully');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize PWA:', error);
      }
    };

    initializePWA();
  }, []);

  // Handle notification permission prompt with delay
  useEffect(() => {
    if (!isInitialized || !autoAskPermission) return;

    const checkAndPromptForPermission = async () => {
      // Only show prompt if push is supported and not already permitted
      if (isPushNotificationSupported() && !(await isPushNotificationPermitted())) {
        // Delay the prompt to avoid overwhelming the user on first visit
        const timer = setTimeout(() => {
          setShowPermissionPrompt(true);
        }, delayPermissionPrompt);
        
        return () => clearTimeout(timer);
      }
    };
    
    checkAndPromptForPermission();
  }, [isInitialized, autoAskPermission, delayPermissionPrompt]);

  return showPermissionPrompt ? (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full">
      <NotificationPermission 
        onClose={() => setShowPermissionPrompt(false)}
        showOnlyIfNotGranted={true}
      />
    </div>
  ) : null;
}
