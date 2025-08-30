import { LoginForm } from "@/components/auth/LoginForm";
import { useApp } from "@/context/AppContext";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface LoginPageProps {
  noRedirect?: boolean;
}

export function LoginPage({ noRedirect = false }: LoginPageProps) {
  const { currentUser, isAuthLoading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from stored session or location state or default to dashboard
  const from = sessionStorage.getItem('redirectPath') || 
               (location.state as any)?.from || 
               "/dashboard";

  // Only redirect if user is authenticated, auth loading has completed, and we're not suppressing redirects
  useEffect(() => {
    if (currentUser && !isAuthLoading && !noRedirect) {
      // Navigate immediately to improve perceived performance
      navigate(from, { replace: true });
    }
  }, [currentUser, isAuthLoading, navigate, from, noRedirect]);

  // If we're doing an inline auth check (noRedirect=true), don't show loading indicators
  // They'll be shown by the parent skeleton component instead
  if (isAuthLoading && !noRedirect) {
    return null; // Return nothing - skeleton will be shown by parent component
  }

  // Always render the login form without waiting for auth check
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Để Tui Trả</h1>
          <p className="text-muted-foreground mt-2">Quản lý quỹ chung dễ dàng</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
