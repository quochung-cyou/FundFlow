
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DashboardSkeleton } from "./components/skeletons/DashboardSkeleton";
import { PWAInitializer, InstallPWAPrompt, FCMInitializer } from "./components/pwa";

// Dynamic imports for code splitting - Components will load only when needed
// Using chunk-friendly names to improve caching and loading speed
const AppLayout = lazy(() => import("./components/layout/AppLayout").then(module => ({ default: module.AppLayout })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(module => ({ default: module.LoginPage })));

// Lazy loaded page components - each route gets its own chunk
const Dashboard = lazy(() => import("./pages/Dashboard" /* webpackChunkName: "dashboard" */));
const CreateFund = lazy(() => import("./pages/CreateFund" /* webpackChunkName: "create-fund" */));
const FundDetails = lazy(() => import("./pages/FundDetails" /* webpackChunkName: "fund-details" */));
const NotFound = lazy(() => import("./pages/NotFound" /* webpackChunkName: "not-found" */));

// Create a more optimized QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents unnecessary refetches
      retry: 1,                    // Limit retry attempts
      staleTime: 60 * 1000,        // Data is fresh for 1 minute
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        {/* PWA Components */}
        <PWAInitializer autoAskPermission={true} delayPermissionPrompt={5000} />
        <FCMInitializer />
        <div className="fixed bottom-4 left-4 z-50 max-w-md w-full">
          <InstallPWAPrompt />
        </div>
        <BrowserRouter>
          {/* Using the DashboardSkeleton for a consistent loading experience */}
          <Suspense fallback={<DashboardSkeleton />}>
            <Routes>
              {/* We can still keep a dedicated login route for direct login links */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes - ProtectedRoute will handle auth checks */}
              {/* Without redirecting, just showing appropriate UI */}
              <Route element={<ProtectedRoute />}>
                <Route element={
                  <Suspense fallback={<DashboardSkeleton />}>
                    <AppLayout />
                  </Suspense>
                }>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <Dashboard />
                    </Suspense>
                  } />
                  <Route path="/funds/new" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <CreateFund />
                    </Suspense>
                  } />
                  <Route path="/funds/:id" element={
                    <Suspense fallback={<DashboardSkeleton />}>
                      <FundDetails />
                    </Suspense>
                  } />
                </Route>
              </Route>
              
              {/* Fallback route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
