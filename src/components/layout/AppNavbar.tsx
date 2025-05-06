
import { Link, useLocation } from "react-router-dom";
import { PiggyBank, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppNavbar() {
  const { currentUser, logout, isAuthLoading } = useApp();
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();

  // Handle navigation with sidebar closing on mobile
  const handleNavigation = () => {
    if (isMobile) {
      console.log("isMobile");
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!currentUser) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0 z-20"
    >
      <div className="flex items-center gap-2 md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <img className="text-white p-1.5 rounded-md w-12 h-12" src="/logo.png" alt="Fund Flow" />
        <h2 className="font-semibold text-lg hidden md:block">Fund Flow</h2>
      </div>

      <div className="flex gap-2 items-center">
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/dashboard"
            onClick={handleNavigation}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative py-1",
              location.pathname === "/dashboard" ? 
                "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 
                "text-muted-foreground"
            )}
          >
            Dashboard
          </Link>
          <Link 
            to="/funds/new"
            onClick={handleNavigation}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative py-1",
              location.pathname === "/funds/new" ? 
                "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 
                "text-muted-foreground"
            )}
          >
            Create Fund
          </Link>
        </nav>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName} />
                <AvatarFallback>{currentUser.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" disabled={isAuthLoading} onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
