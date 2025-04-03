
import { SidebarProvider } from "@/components/ui/sidebar";
import { useApp } from "@/context/AppContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
