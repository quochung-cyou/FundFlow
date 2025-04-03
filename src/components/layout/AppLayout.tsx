
import { SidebarProvider } from "@/components/ui/sidebar";
import { useApp } from "@/context/AppContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { AppSidebar } from "./AppSidebar";
import { AppNavbar } from "./AppNavbar";
import { MobileNav } from "./MobileNav";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

export function AppLayout() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col">
        <AppNavbar />
        <div className="flex flex-1 w-full overflow-hidden">
          <AppSidebar />
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 overflow-hidden pb-16 md:pb-0"
          >
            <div className="h-full overflow-y-auto p-4 md:p-6">
              <Outlet />
            </div>
          </motion.main>
        </div>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
