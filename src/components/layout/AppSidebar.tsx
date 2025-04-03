
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
import { LogOut, Plus, Home, PiggyBank, X, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function AppSidebar() {
  const { currentUser, funds, logout, selectedFund, setSelectedFund } = useApp();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFunds = funds.filter(fund => 
    fund.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex items-center">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem key="dashboard">
            <SidebarMenuButton 
              asChild
              isActive={location.pathname === "/"}
            >
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
          
          <div className="px-2 mb-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm quỹ..."
                className="pl-8 h-8"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredFunds.length > 0 ? filteredFunds.map((fund) => (
                <motion.div
                  key={fund.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className={cn(
                        selectedFund?.id === fund.id ? "bg-blue-50 text-blue-600" : "",
                        "transition-all duration-200 hover:bg-blue-50/50"
                      )}
                      onClick={() => setSelectedFund(fund)}
                      isActive={location.pathname === `/funds/${fund.id}`}
                      asChild
                    >
                      <Link to={`/funds/${fund.id}`} className="flex items-center gap-3">
                        <span className="text-lg">{fund.icon}</span>
                        <span>{fund.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              )) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Không tìm thấy quỹ nào
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
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
