import { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  subscribeToUserNotifications,
  unsubscribeFromAllNotifications,
  type Notification as NotificationType
} from '@/firebase/messagingService';
import { registerServiceWorker, isPushNotificationSupported, requestPushPermission } from '@/utils/pwaUtils';

interface FCMInitializerProps {
  pollingInterval?: number; // Fallback polling interval if real-time fails
}

export function FCMInitializer({ pollingInterval = 10000 }: FCMInitializerProps) {
  const { currentUser } = useApp();
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState<boolean>(false);
  const notificationsRef = useRef<NotificationType[]>([]);
  const unsubscribeRef = useRef<() => void>(() => {});
  
  // Initialize service worker and push notifications
  useEffect(() => {
    
    async function initializeServiceWorker() {
      if (isPushNotificationSupported()) {
        try {
      
          const registration = await registerServiceWorker();
          if (registration) {
            setServiceWorkerRegistered(true);
            // Log service worker state
            if (registration.active) {
              console.log('Service worker active state:', registration.active.state);
            }
          } else {
            console.error('❌ Service worker registration returned null or undefined');
          }
        } catch (error) {
          console.error('❌ Failed to register service worker:', error);
        }
      } else {
        console.warn('⚠️ Push notifications are NOT supported in this browser');
      }
    }
    
    // Initialize service worker
    initializeServiceWorker();
    
    // Immediate first check for notifications
    if (currentUser) {
  
      setTimeout(() => {
        checkForNewNotifications();
      }, 1000); // Small delay to ensure everything is initialized
    }
    
    // Setup polling for notifications
   
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      if (currentUser) {
        checkForNewNotifications();
      }
    }, pollingInterval);
    
    // Clean up interval on unmount
    return () => {
  
      clearInterval(intervalId);
    };
  }, [currentUser, pollingInterval]);
  
  // Track processed notification IDs to prevent duplicates
  const processedNotificationIds = useRef<Set<string>>(new Set());

  // Function to check for new notifications (polling fallback)
  async function checkForNewNotifications() {
    try {
      // Get all notifications for the current user
      const notifications = await getUserNotifications(currentUser.id);
      
      if (notifications && notifications.length > 0) {
        // Sort notifications by creation time (newest first)
        const sortedNotifications = notifications.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (typeof a.createdAt === 'object' && a.createdAt !== null ? a.createdAt.seconds * 1000 : Number(a.createdAt || 0));
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (typeof b.createdAt === 'object' && b.createdAt !== null ? b.createdAt.seconds * 1000 : Number(b.createdAt || 0));
          return timeB - timeA;
        });
        
        // Find notifications that are newer than the last notification we've seen and haven't been sent yet
        const newNotifications = sortedNotifications.filter(notification => {
          const notificationTime = notification.createdAt instanceof Date 
            ? notification.createdAt.getTime() 
            : (typeof notification.createdAt === 'object' && notification.createdAt !== null ? notification.createdAt.seconds * 1000 : Number(notification.createdAt || 0));
          
          // Check if notification is new, not processed, and not already read by this user
          const readBy = notification.readBy || [];
          const isReadByCurrentUser = readBy.includes(currentUser.id);
          
          const isNew = !isReadByCurrentUser && 
                       notificationTime > lastNotificationTime && 
                       !processedNotificationIds.current.has(notification.id);
          
          return isNew;
        });
        // Update the last notification time
        if (newNotifications.length > 0) {
          const latestTime = Math.max(
            ...newNotifications.map(n => {
              return n.createdAt instanceof Date 
                ? n.createdAt.getTime() 
                : (typeof n.createdAt === 'object' && n.createdAt !== null ? n.createdAt.seconds * 1000 : Number(n.createdAt || 0));
            })
          );
          setLastNotificationTime(latestTime);
          
          // Process each new notification
          newNotifications.forEach(async notification => {
            try {
              // Mark as processed to prevent duplicates
              processedNotificationIds.current.add(notification.id);
           
              // Show browser push notification
              showBrowserNotification(notification);
              
              // Mark notification as read by current user in the database
              if (notification.fundId) {
                // For fund-based notifications
                const notificationRef = doc(
                  db, 
                  'fund_notifications', 
                  notification.fundId, 
                  'notifications', 
                  notification.id
                );
                
                // Update the readBy array to include the current user
                await updateDoc(notificationRef, {
                  readBy: arrayUnion(currentUser.id),
                  lastReadAt: Date.now()
                });
          
              }
            } catch (error) {
              console.error('Error processing notification:', notification.id, error);
            }
          });
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }

  // Helper function to show a browser notification
  function showBrowserNotification(notification: NotificationType) {
    // Check if browser notifications are supported and permission is granted
    if (!('Notification' in window)) {
      return;
    }
    
    if (Notification.permission !== 'granted') {
      return;
    }
    
    // Check if we have an active service worker
    if (!navigator.serviceWorker.controller) {
      // Try to register service worker if not available
      registerServiceWorker().catch(err => console.error('Failed to register service worker:', err));
      return;
    }
    
    try {
      // Use the service worker to show the notification
      navigator.serviceWorker.ready.then(registration => {
        console.log('Showing browser notification via service worker');
        registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/pwa-512x512.png',
          badge: '/logo.png',
          vibrate: [100, 50, 100],
          tag: notification.id, // Use ID as tag to prevent duplicates
          renotify: true, // Always notify even if a notification with same tag exists
          requireInteraction: true, // Keep notification visible until user interacts
          data: {
            url: notification.clickAction || '/',
            notificationId: notification.id,
            fundId: notification.data?.fundId,
            transactionId: notification.data?.transactionId
          }
        }).then(() => {
          console.log('Browser notification shown successfully');
        }).catch(error => {
          console.error('Error showing browser notification:', error);
        });
      });
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }

  // This component doesn't render anything
  return null;
}
