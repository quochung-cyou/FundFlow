
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Plus, Home, PiggyBank } from "lucide-react";
import { Link } from "react-router-dom";
import { Fragment } from "react";

export function AppSidebar() {
  const { currentUser, funds, logout, selectedFund, setSelectedFund } = useApp();

  if (!currentUser) return null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 text-white p-1.5 rounded-md">
              <PiggyBank className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-lg">Fund Flow</h2>
          </div>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem key="dashboard">
            <SidebarMenuButton asChild>
              <Link to="/" className="flex items-center gap-3">
                <Home className="h-4 w-4" />
                <span>Tổng quan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between items-center px-4 py-2">
            <span>Quỹ của bạn</span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              asChild
            >
              <Link to="/funds/new">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {funds.map((fund) => (
                <SidebarMenuItem key={fund.id}>
                  <SidebarMenuButton
                    className={selectedFund?.id === fund.id ? "bg-blue-50 text-blue-600" : ""}
                    onClick={() => setSelectedFund(fund)}
                    asChild
                  >
                    <Link to={`/funds/${fund.id}`} className="flex items-center gap-3">
                      <span className="text-lg">{fund.icon}</span>
                      <span>{fund.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName} />
              <AvatarFallback>{currentUser.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">{currentUser.displayName}</div>
              <div className="text-xs text-muted-foreground">{currentUser.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
