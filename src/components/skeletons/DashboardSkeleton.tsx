import React from 'react';

/**
 * Smooth fade loading component for the dashboard and other pages
 * Shows a gentle fade animation while content is loading
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="relative">
        {/* Main loading circle */}
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"></div>
        
        {/* Pulsing backdrop */}
        <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-50 animate-pulse opacity-30"></div>
        
        {/* Smooth fade overlay */}
        <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-transparent via-blue-50/20 to-transparent animate-ping opacity-20"></div>
      </div>
      
      {/* Optional loading text */}
      <div className="absolute mt-20 text-sm text-muted-foreground animate-pulse">
        Đang tải...
      </div>
    </div>
  );
}
