import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

// Dynamically import Firebase messaging to prevent initialization errors
let messagingService: typeof import('@/firebase/messagingService') | null = null;

interface FCMInitializerProps {
  onTokenReceived?: (token: string) => void;
}

export function FCMInitializer({ onTokenReceived }: FCMInitializerProps) {
  const { currentUser } = useApp();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Firebase Cloud Messaging
  useEffect(() => {
    if (!currentUser || isInitialized) return;

    const initializeFCM = async () => {
      try {
        // Dynamically import the messaging service to prevent initialization errors
        if (!messagingService) {
          try {
            messagingService = await import('@/firebase/messagingService');
          } catch (importError) {
            console.error('Error importing messaging service:', importError);
            return;
          }
        }
        
        // Request permission and get token
        const token = await messagingService.requestFCMPermission();
        
        if (token) {
          console.log('FCM Token:', token);
          
          // Save token to Firestore
          await messagingService.saveFCMToken(currentUser.id, token);
          
          // Call callback if provided
          if (onTokenReceived) {
            onTokenReceived(token);
          }
          
          // Set up message handler for foreground messages
          messagingService.onFCMMessage((payload) => {
            console.log('Foreground message received:', payload);
            
            // Show toast notification for foreground messages
            if (payload.notification) {
              toast(payload.notification.title, {
                description: payload.notification.body,
                action: {
                  label: 'View',
                  onClick: () => {
                    // Navigate to the transaction
                    const url = payload.data?.url || '/';
                    window.location.href = url;
                  }
                }
              });
            }
          });
          
          setIsInitialized(true);
        } else {
          console.log('Failed to get FCM token or permission denied');
        }
      } catch (error) {
        console.error('Error initializing FCM:', error);
        // Don't block the app if FCM fails
        setIsInitialized(true);
      }
    };

    initializeFCM();
  }, [currentUser, isInitialized, onTokenReceived]);

  // This is a utility component that doesn't render anything
  return null;
}
