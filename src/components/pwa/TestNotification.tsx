import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { sendTestPushNotification, isPushNotificationPermitted } from '@/utils/pwaUtils';

interface TestNotificationProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function TestNotification({ 
  variant = "default", 
  size = "default",
  className = ""
}: TestNotificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSendNotification = async () => {
    setIsLoading(true);
    setShowSuccess(false);
    
    try {
      // Check if permission is granted
      const hasPermission = await isPushNotificationPermitted();
      
      if (!hasPermission) {
        alert("Please enable notifications first to test this feature.");
        return;
      }
      
      // Send test notification
      const success = await sendTestPushNotification();
      
      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={handleSendNotification}
        disabled={isLoading}
        className={`gap-2 ${className}`}
      >
        {isLoading ? 'Sending...' : 'Test Notification'}
        <Bell className="h-4 w-4" />
      </Button>
      
      {showSuccess && (
        <div className="absolute top-full mt-2 p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs rounded-md whitespace-nowrap">
          Notification sent successfully!
        </div>
      )}
    </div>
  );
}
