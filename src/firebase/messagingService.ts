import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, Timestamp, onSnapshot, collectionGroup, writeBatch, arrayUnion } from 'firebase/firestore';
import { db } from './config';
import { User } from '@/types';
import { getUserById } from './userService';
import { formatCurrency } from '@/lib/utils';

// Collection references
const USERS_COLLECTION = 'users';
const FUND_NOTIFICATIONS_COLLECTION = 'fund_notifications'; // Parent collection for fund notifications

/**
 * Create a notification in Firestore for a recipient
 * @param fundId Fund ID to create the notification in
 * @param title Notification title
 * @param body Notification body
 * @param icon Notification icon URL
 * @param clickAction URL to navigate to when notification is clicked
 * @param data Additional data to store with the notification
 * @param recipients Array of user IDs to receive the notification
 * @returns Promise<string> ID of the created notification
 */
export const createNotification = async (
  fundId: string,
  title: string,
  body: string,
  icon: string = '',
  clickAction: string = '',
  data: Record<string, string> = {},
  recipients: string[] = []
): Promise<string> => {
  try {
    // First, check if the fund document exists in the fund_notifications collection
    const fundNotificationsRef = doc(db, FUND_NOTIFICATIONS_COLLECTION, fundId);
    const fundNotificationsDoc = await getDoc(fundNotificationsRef);
    
    // If the fund document doesn't exist, create it
    if (!fundNotificationsDoc.exists()) {
      await setDoc(fundNotificationsRef, {
        fundId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    
    // Generate a unique ID for the notification
    const timestamp = Date.now();
    const notificationId = `notification_${timestamp}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Reference to the notification document in the fund's subcollection
    const notificationRef = doc(
      db, 
      FUND_NOTIFICATIONS_COLLECTION, 
      fundId, 
      'notifications', 
      notificationId
    );
    
    // Create the notification document
    await setDoc(notificationRef, {
      id: notificationId,
      title,
      body,
      icon,
      clickAction,
      data,
      createdAt: timestamp,
      recipients,
      readBy: []
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param userId User ID
 * @returns Array of notifications
 */
export const getUserNotifications = async (userId: string): Promise<any[]> => {
  try {
    // First, get all funds the user is a member of
    const fundsRef = collection(db, 'funds');
    const fundsQuery = query(fundsRef, where('members', 'array-contains', userId));
    const fundsSnapshot = await getDocs(fundsQuery);
    
    if (fundsSnapshot.empty) {
      return [];
    }
    
    const fundIds = fundsSnapshot.docs.map(doc => doc.id);
    
    // Get notifications from each fund
    const allNotifications: any[] = [];
    
    for (const fundId of fundIds) {
      try {
        const fundNotificationsRef = collection(db, FUND_NOTIFICATIONS_COLLECTION, fundId, 'notifications');
        const notificationsQuery = query(fundNotificationsRef, orderBy('createdAt', 'desc'));
        const notificationsSnapshot = await getDocs(notificationsQuery);
        
        if (!notificationsSnapshot.empty) {
          const fundNotifications = notificationsSnapshot.docs.map(doc => {
            const data = doc.data();
            const readBy = data.readBy || [];
            
            return {
              id: doc.id,
              fundId,
              ...data,
              read: readBy.includes(userId),
              createdAt: new Date(data.createdAt)
            };
          });
          
          allNotifications.push(...fundNotifications);
        }
      } catch (fundError) {
        console.error(`Error getting notifications for fund ${fundId}:`, fundError);
        // Continue with other funds even if one fails
      }
    }
    
    // Sort all notifications by creation time (newest first)
    allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return allNotifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

/**
 * Mark a notification as read
 * @param notificationId Notification ID
 * @param fundId Fund ID the notification belongs to
 * @param userId User ID marking the notification as read
 * @returns Promise<void>
 */
export const markNotificationAsRead = async (
  notificationId: string,
  fundId: string,
  userId: string
): Promise<void> => {
  try {
    // Reference to the notification document in the fund's subcollection
    const notificationRef = doc(
      db, 
      FUND_NOTIFICATIONS_COLLECTION, 
      fundId, 
      'notifications', 
      notificationId
    );
    
    // Get the current notification data
    const notificationDoc = await getDoc(notificationRef);
    if (!notificationDoc.exists()) {
      console.error(`Notification ${notificationId} not found in fund ${fundId}`);
      return;
    }
    
    // Update the readBy array to include this user
    await updateDoc(notificationRef, {
      readBy: arrayUnion(userId),
      lastReadAt: Date.now()
    });
    

  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Send a transaction notification to users in a fund
 * @param creatorId User ID of the transaction creator
 * @param fundId Fund ID
 * @param transactionId Transaction ID
 * @param description Transaction description
 * @param amount Transaction amount
 * @param recipientIds User IDs to send notification to
 * @returns Promise<void>
 */
export const sendTransactionNotification = async (
  creatorId: string,
  fundId: string,
  transactionId: string,
  description: string,
  amount: number,
  recipientIds: string[]
): Promise<void> => {
  try {
    // Default values
    let creatorName = 'Someone';
    let creatorPhoto = '/pwa-512x512.png';
    
    try {
      const creator = await getUserById(creatorId);
      if (creator) {
        creatorName = creator.displayName || 'Thành viên';
        creatorPhoto = creator.photoURL || '/pwa-512x512.png';
      }
    } catch (creatorError) {
      console.warn('Error getting creator data:', creatorError);
      // Continue with default values
    }
    
    // Filter out the creator from recipients
    const filteredRecipients = recipientIds.filter(id => id !== creatorId);
    
    if (filteredRecipients.length === 0) {
      return;
    }
    
    // Format amount as currency
    const formattedAmount = formatCurrency(amount);
    
    // Create notification details
    const title = 'Giao dịch mới từ ' + creatorName;
    const body = `${description}: ${formattedAmount}`;
    const clickAction = `/funds/${fundId}?transaction=${transactionId}`;
    
    // Additional data to include with the notification
    const data = {
      fundId,
      transactionId,
      creatorId,
      description,
      amount: amount.toString(),
      creatorName,
      timestamp: Date.now().toString(),
    };
    

    
    try {
      // First, check if the fund document exists in the fund_notifications collection
      const fundNotificationsRef = doc(db, FUND_NOTIFICATIONS_COLLECTION, fundId);
      const fundNotificationsDoc = await getDoc(fundNotificationsRef);
      

      // If the fund document doesn't exist, create it
      if (!fundNotificationsDoc.exists()) {
        await setDoc(fundNotificationsRef, {
          fundId,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      
      // Create a unique notification ID
      const timestamp = Date.now();
      const notificationId = `tx_${transactionId}_${timestamp}`;
      
      // Reference to the notification document in the fund's subcollection
      const notificationRef = doc(
        db, 
        FUND_NOTIFICATIONS_COLLECTION, 
        fundId, 
        'notifications', 
        notificationId
      );
      
     
      // Create the notification in the fund's subcollection
      await setDoc(notificationRef, {
        id: notificationId,
        transactionId,
        title,
        body,
        icon: creatorPhoto,
        clickAction,
        data,
        createdAt: timestamp,
        senderId: creatorId,
        recipients: filteredRecipients,
        readBy: [] // Array of user IDs who have read this notification
      });
      
     
    } catch (error) {
      console.error(`Error creating notification for fund ${fundId}:`, error);
    }
  } catch (error) {
    console.error('Error sending transaction notification:', error);
  }
};

// Export notification interface for use in other components
export interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  clickAction?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: number | Date;
  readAt?: number;
  recipientId: string;
  senderId?: string;
}

// Active notification listeners
type NotificationListener = () => void;
const activeListeners: Map<string, NotificationListener> = new Map();

/**
 * Subscribe to real-time notifications for a user
 * @param userId User ID to subscribe to notifications for
 * @param callback Function to call when new notifications are received
 * @returns Unsubscribe function
 */
export const subscribeToUserNotifications = (userId: string, callback: (notifications: Notification[]) => void): () => void => {
  if (!userId) {
    console.warn('Cannot subscribe to notifications: No user ID provided');
    return () => {};
  }

  // Create a unique key for this listener
  const listenerKey = `notifications_${userId}_${Date.now()}`;
  
  // Check if we already have an active listener for this user
  if (activeListeners.has(`notifications_${userId}`)) {
    return () => {}; // Return a no-op unsubscribe function
  }

  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp 
          ? doc.data().createdAt.toDate() 
          : new Date(doc.data().createdAt)
      })) as Notification[];
      
  
      callback(notifications);
    }, (error) => {
      console.error('Error in notification listener:', error);
    });

    // Store the unsubscribe function
    activeListeners.set(`notifications_${userId}`, unsubscribe);
    
    return () => {
      unsubscribe();
      activeListeners.delete(`notifications_${userId}`);
    };
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    return () => {}; // Return a no-op unsubscribe function
  }
};

/**
 * Unsubscribe from all active notification listeners
 */
export const unsubscribeFromAllNotifications = () => {

  activeListeners.forEach((unsubscribe, key) => {
    unsubscribe();
  });
  activeListeners.clear();
};
