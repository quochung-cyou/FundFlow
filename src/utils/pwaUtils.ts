// PWA and Push Notification Utilities

/**
 * Check if the browser supports push notifications
 */
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Check if the app is installed as PWA
 */
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

/**
 * Check if push notifications are already permitted
 */
export const isPushNotificationPermitted = async () => {
  if (!isPushNotificationSupported()) return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/**
 * Get the current notification permission status
 */
export const getNotificationPermissionStatus = async () => {
  if (!('Notification' in window)) return 'unsupported';
  
  return Notification.permission;
};

/**
 * Request push notification permission
 */
export const requestPushPermission = async (): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Register the service worker
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  
  return null;
};

/**
 * Subscribe to push notifications
 * Note: In a real app, you would send this subscription to your server
 */
export const subscribeToPushNotifications = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // This would typically come from your server
    const applicationServerKey = urlBase64ToUint8Array(
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
    );
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    console.log('Push notification subscription:', subscription);
    
    // In a real app, you would send this subscription to your server
    // await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

/**
 * Send a test push notification (for development purposes)
 */
export const sendTestPushNotification = async () => {
  if (!isPushNotificationSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // This is just for testing - in a real app, notifications would come from your server
    registration.showNotification('Welcome to Fund Flow!', {
      body: 'Thank you for enabling notifications. You will now receive updates on your transactions.',
      icon: '/pwa-512x512.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        url: '/'
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

/**
 * Helper function to convert base64 to Uint8Array
 * (required for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
