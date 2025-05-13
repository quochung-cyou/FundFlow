import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, AlertTriangle } from "lucide-react";
import { 
  getNotificationPermissionStatus, 
  isPushNotificationSupported, 
  requestPushPermission,
  sendTestPushNotification
} from '@/utils/pwaUtils';

interface NotificationPermissionProps {
  onClose?: () => void;
  showOnlyIfNotGranted?: boolean;
}

export function NotificationPermission({ 
  onClose, 
  showOnlyIfNotGranted = true 
}: NotificationPermissionProps) {
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const status = await getNotificationPermissionStatus();
      setPermissionStatus(status as any);
      
      // Only show the card if:
      // 1. Notifications are supported
      // 2. AND (permission is not granted OR we want to show regardless of permission status)
      setShowCard(
        status !== 'unsupported' && 
        (!showOnlyIfNotGranted || status !== 'granted')
      );
    };
    
    checkPermission();
  }, [showOnlyIfNotGranted]);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPushPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      // If granted, send a test notification
      if (granted) {
        setTimeout(() => {
          sendTestPushNotification();
        }, 1000);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowCard(false);
    onClose?.();
  };

  if (!showCard) return null;

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-primary/10 animate-in fade-in-50 duration-300">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {permissionStatus === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
          </CardTitle>
          {permissionStatus === 'granted' && <Bell className="h-5 w-5 text-green-500" />}
          {permissionStatus === 'denied' && <BellOff className="h-5 w-5 text-red-500" />}
          {permissionStatus === 'default' && <Bell className="h-5 w-5 text-primary" />}
        </div>
        <CardDescription>
          {permissionStatus === 'granted' 
            ? 'You will receive notifications about your transactions and important updates.'
            : permissionStatus === 'denied'
              ? 'You have blocked notifications. Please enable them in your browser settings.'
              : 'Get notified about your transactions and important updates.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {permissionStatus === 'denied' && (
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md flex items-start gap-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p>
              Notifications are blocked. To enable them, please check your browser settings 
              and look for site permissions for this website.
            </p>
          </div>
        )}
        {!isPushNotificationSupported() && (
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md flex items-start gap-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p>
              Your browser doesn't support push notifications. 
              Try using a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleClose}>
          {permissionStatus === 'granted' ? 'Close' : 'Maybe Later'}
        </Button>
        {permissionStatus === 'default' && (
          <Button 
            onClick={handleRequestPermission} 
            disabled={isLoading || !isPushNotificationSupported()}
            className="gap-2"
          >
            {isLoading ? 'Requesting...' : 'Enable Notifications'}
            {!isLoading && <Bell className="h-4 w-4" />}
          </Button>
        )}
        {permissionStatus === 'denied' && (
          <Button 
            variant="default"
            onClick={() => window.open('about:preferences#permissions', '_blank')}
          >
            Open Settings
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
