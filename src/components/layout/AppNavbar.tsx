
import { Link, useLocation } from "react-router-dom";
import { PiggyBank, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function AppNavbar() {
  const { currentUser } = useApp();
  const { toggleSidebar, isMobile } = useSidebar();
  const location = useLocation();

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
        <div className="bg-blue-500 text-white p-1.5 rounded-md">
          <PiggyBank className="h-5 w-5" />
        </div>
        <h2 className="font-semibold text-lg hidden md:block">Fund Flow</h2>
      </div>

      <div className="flex gap-2">
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative py-1",
              location.pathname === "/" ? 
                "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 
                "text-muted-foreground"
            )}
          >
            Dashboard
          </Link>
          <Link 
            to="/funds/new"
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
      </div>
    </motion.div>
  );
}
