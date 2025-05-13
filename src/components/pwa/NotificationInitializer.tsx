import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getUserNotifications, markNotificationAsRead, Notification } from '@/firebase/messagingService';

interface NotificationInitializerProps {
  pollingInterval?: number; // How often to check for new notifications (in ms)
}

export function NotificationInitializer({ pollingInterval = 30000 }: NotificationInitializerProps) {
  const { currentUser } = useApp();
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  // Poll for new notifications
  useEffect(() => {
    if (!currentUser) return;
    
    // Initial check for notifications
    // Removed polling as it's handled in FCMInitializer
    // checkForNewNotifications();
    
    // Set up polling interval
    // const intervalId = setInterval(checkForNewNotifications, pollingInterval);
    
    // Clean up interval on unmount
    // return () => clearInterval(intervalId);
  }, [currentUser, pollingInterval, lastNotificationTime]);

  async function checkForNewNotifications() {
    try {
      // Get all notifications for the current user
      const notifications = await getUserNotifications(currentUser.id);
      
      if (notifications && notifications.length > 0) {
        // Sort notifications by creation time (newest first)
        const sortedNotifications = notifications.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
          return timeB - timeA;
        });
        
        // Get the latest notification time
        const latestNotification = sortedNotifications[0];
        const latestTime = latestNotification.createdAt instanceof Date 
          ? latestNotification.createdAt.getTime() 
          : latestNotification.createdAt;
        
        // Update the last notification time
        if (latestTime > lastNotificationTime) {
          setLastNotificationTime(latestTime);
        }
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }

  // This component doesn't render anything
  return null;
}
