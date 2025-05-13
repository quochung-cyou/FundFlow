import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './config';
import { getApp } from 'firebase/app';
import { User } from '@/types';

// Get the existing Firebase app instance instead of creating a new one
const app = getApp();

// Initialize Firebase Messaging with the existing app
const messaging = getMessaging(app);

// Collection references
const USERS_COLLECTION = 'users';
const FCM_TOKENS_COLLECTION = 'fcmTokens';

/**
 * Request permission and get FCM token
 * @returns FCM token or null if permission denied
 */
export const requestFCMPermission = async (): Promise<string | null> => {
  try {
    // Check if notification permission is already granted
    if (Notification.permission === 'granted') {
      return await getFCMToken();
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await getFCMToken();
    }
    
    return null;
  } catch (error) {
    console.error('Error requesting FCM permission:', error);
    return null;
  }
};

/**
 * Get FCM token
 * @returns FCM token or null if error
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BCQaFtfBgtDoi9z9RAjKv87J_TqvAmmvcalDJDt6OZJAjFI-kxthu0LjW8cYMPERGgFArU5AgSgKR5vwiI26O28'
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Save FCM token to Firestore for a user
 * @param userId User ID
 * @param token FCM token
 */
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    // Check if token already exists for this user
    const userTokensRef = doc(db, FCM_TOKENS_COLLECTION, userId);
    const userTokensDoc = await getDoc(userTokensRef);
    
    if (userTokensDoc.exists()) {
      // Update existing tokens
      const tokens = userTokensDoc.data().tokens || [];
      if (!tokens.includes(token)) {
        await updateDoc(userTokensRef, {
          tokens: arrayUnion(token),
          updatedAt: Date.now()
        });
      }
    } else {
      // Create new tokens document
      await setDoc(userTokensRef, {
        userId,
        tokens: [token],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
};

/**
 * Get FCM tokens for a list of users
 * @param userIds List of user IDs
 * @returns Map of user IDs to their FCM tokens
 */
export const getFCMTokensForUsers = async (userIds: string[]): Promise<Map<string, string[]>> => {
  try {
    const tokensMap = new Map<string, string[]>();
    
    // Get tokens for each user
    for (const userId of userIds) {
      try {
        const userTokensRef = doc(db, FCM_TOKENS_COLLECTION, userId);
        const userTokensDoc = await getDoc(userTokensRef);
        
        if (userTokensDoc.exists()) {
          const tokens = userTokensDoc.data().tokens || [];
          tokensMap.set(userId, tokens);
        } else {
          tokensMap.set(userId, []);
        }
      } catch (userError) {
        // Handle individual user token fetch errors
        console.warn(`Could not fetch tokens for user ${userId}:`, userError);
        tokensMap.set(userId, []);
      }
    }
    
    return tokensMap;
  } catch (error) {
    console.error('Error getting FCM tokens for users:', error);
    return new Map();
  }
};

/**
 * Send a transaction notification to users
 * @param creatorId User ID of the transaction creator
 * @param fundId Fund ID
 * @param transactionId Transaction ID
 * @param description Transaction description
 * @param amount Transaction amount
 * @param recipientIds User IDs to send notification to
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
    // Get creator user data
    let creatorName = 'Thành viên';
    let creatorPhoto = '/pwa-512x512.png';
    
    try {
      const creatorRef = doc(db, USERS_COLLECTION, creatorId);
      const creatorDoc = await getDoc(creatorRef);
      
      if (creatorDoc.exists()) {
        const creatorData = creatorDoc.data() as User;
        creatorName = creatorData.displayName || 'Thành viên';
        creatorPhoto = creatorData.photoURL || '/pwa-512x512.png';
      }
    } catch (creatorError) {
      console.warn('Error getting creator data:', creatorError);
      // Continue with default values
    }
    
    // Filter out the creator from recipients
    const filteredRecipients = recipientIds.filter(id => id !== creatorId);
    
    if (filteredRecipients.length === 0) {
      console.log('No recipients to notify');
      return;
    }
    
    // Get FCM tokens for recipients - handle permission errors gracefully
    let tokensMap: Map<string, string[]>;
    try {
      tokensMap = await getFCMTokensForUsers(filteredRecipients);
    } catch (tokenError) {
      console.warn('Could not get FCM tokens, using empty map:', tokenError);
      tokensMap = new Map();
    }
    
    // Format amount as currency
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
    
    // Create notification payload
    const payload = {
      notification: {
        title: 'Giao dịch mới từ ' + creatorName,
        body: `${description}: ${formattedAmount}`,
        icon: creatorPhoto,
        clickAction: `/funds/${fundId}?transaction=${transactionId}`
      },
      data: {
        fundId,
        transactionId,
        creatorId,
        description,
        amount: amount.toString(),
        creatorName,
        creatorPhoto,
        timestamp: Date.now().toString(),
        url: `/funds/${fundId}?transaction=${transactionId}`
      }
    };
    
    // Send to Cloud Function to deliver notifications
    // This would typically be handled by a Cloud Function
    // For now, we'll just log the payload
    console.log('Notification payload:', payload);
    console.log('Recipients:', filteredRecipients);
    console.log('Tokens count:', Array.from(tokensMap.entries()).reduce((count, [_, tokens]) => count + tokens.length, 0));
    
    // In a real implementation, you would call a Cloud Function here
    // await fetch('https://your-cloud-function-url', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     tokens: Array.from(tokensMap.values()).flat(),
    //     payload
    //   })
    // });
    
    // For now, we can use the service worker to show a notification locally
    // This is just for testing purposes
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon,
          data: payload.data
        });
      } catch (swError) {
        console.warn('Could not show local notification:', swError);
      }
    }
  } catch (error) {
    console.error('Error sending transaction notification:', error);
  }
};

/**
 * Set up FCM message handler
 * @param callback Function to call when a message is received
 */
export const onFCMMessage = (callback: (payload: any) => void): void => {
  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    callback(payload);
  });
};
