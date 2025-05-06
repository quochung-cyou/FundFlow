import React from 'react';

/**
 * Skeleton loader for the dashboard and other pages
 * Shows a realistic page layout with animated loading placeholders
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="border-b border-border h-16 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-32 h-8 bg-muted/60 rounded-md animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-muted/60 animate-pulse"></div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-64 border-r border-border min-h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-muted/60 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <main className="flex-1 p-6 space-y-6">
          {/* Title section */}
          <div className="flex justify-between items-center">
            <div className="w-48 h-8 bg-muted/60 rounded-md animate-pulse"></div>
            <div className="w-32 h-10 bg-muted/60 rounded-md animate-pulse"></div>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="border border-border rounded-lg p-4 h-32 flex flex-col justify-between animate-pulse"
              >
                <div className="w-24 h-6 bg-muted/60 rounded-md"></div>
                <div className="w-32 h-10 bg-muted/60 rounded-md"></div>
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="border border-border rounded-lg mt-6">
            <div className="border-b border-border p-4 bg-muted/20">
              <div className="w-48 h-6 bg-muted/60 rounded-md animate-pulse"></div>
            </div>
            <div className="p-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 border-b border-border last:border-0"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-muted/60 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-muted/60 rounded-md animate-pulse"></div>
                      <div className="w-24 h-4 bg-muted/60 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-20 h-8 bg-muted/60 rounded-md animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
