import { useApp } from "@/context/AppContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

// Load React components needed for auth flow
import { Suspense, lazy } from 'react';

// Import the skeleton loader
import { DashboardSkeleton } from '../skeletons/DashboardSkeleton';

// Properly typed import for LoginPage component with its props
interface LoginPageProps {
  noRedirect?: boolean;
}

// Lazy loaded LoginPage to avoid loading it until needed
const LoginPage = lazy(() => 
  import('../../pages/LoginPage').then(module => ({
    default: (props: LoginPageProps) => <module.LoginPage {...props} />
  }))
);

export function ProtectedRoute() {
  const { currentUser, isAuthLoading } = useApp();
  const location = useLocation();
  
  // Store the current route for potential login redirect
  useEffect(() => {
    if (location.pathname !== '/login') {
      sessionStorage.setItem('redirectPath', location.pathname);
    }
  }, [location.pathname]);

  // If we're still checking auth status but have no user yet, show skeleton
  // This prevents unnecessary redirects to login while auth is being checked
  if (isAuthLoading && !currentUser) {
    // Show site skeleton based on the current route instead of generic loading
    return <DashboardSkeleton />;
  }

  // Only show login when we're 100% sure there's no authenticated user
  if (!currentUser && !isAuthLoading) {
    // Instead of Navigate, render LoginPage inline to avoid URL change
    // This feels more seamless as the URL doesn't change unnecessarily
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <LoginPage noRedirect />
      </Suspense>
    );
  }

  // User is authenticated, render the requested route
  return <Outlet />;
}
