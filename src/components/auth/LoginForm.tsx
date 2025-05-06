import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export function LoginForm() {
  const { login, isAuthLoading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from || "/dashboard";

  const handleGoogleLogin = async () => {
    try {
      await login();
      // Redirect to the page they were trying to access or dashboard
      navigate(from, { replace: true });
    } catch (err) {
      // Error is already handled in the login function with toast
      // This is just for additional error handling if needed
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>
          Đăng nhập vào tài khoản của bạn để tiếp tục
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Button 
          onClick={handleGoogleLogin} 
          className="w-full flex items-center justify-center gap-2" 
          variant="outline"
          disabled={isAuthLoading}
        >
          <FcGoogle className="h-5 w-5" />
          {isAuthLoading ? "Đang đăng nhập..." : "Đăng nhập với Google"}
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Sử dụng tài khoản Google của bạn để đăng nhập
        </p>
      </CardFooter>
    </Card>
  );
}
