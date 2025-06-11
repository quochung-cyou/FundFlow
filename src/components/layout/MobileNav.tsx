
import { Home, PiggyBank, Plus, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export function MobileNav() {
  const location = useLocation();
  const { currentUser, selectedFund } = useApp();
  const [activeTab, setActiveTab] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  if (!currentUser) return null;

  const navItems: NavItem[] = [
    {
      name: "Home",
      url: "/",
      icon: Home
    },
    {
      name: "Fund",
      url: selectedFund ? `/funds/${selectedFund.id}` : "/funds",
      icon: PiggyBank,
      disabled: !selectedFund
    },
    {
      name: "New",
      url: "/funds/new",
      icon: Plus
    }
  ];

  // Set active tab based on current location
  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = navItems.find(item => 
      item.url === currentPath || 
      (currentPath.startsWith("/funds/") && item.url.includes("/funds/"))
    );
    
    if (activeItem) {
      setActiveTab(activeItem.name);
    } else {
      setActiveTab(navItems[0].name);
    }
  }, [location.pathname]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3 bg-background/80 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            
            return item.disabled ? (
              <div
                key={item.name}
                className={cn(
                  "relative cursor-not-allowed text-sm font-medium px-6 py-2 rounded-full transition-colors",
                  "text-foreground/80",
                  "opacity-50 pointer-events-none"
                )}
              >
                <span className="flex flex-col items-center gap-1">
                  <item.icon size={18} strokeWidth={2.5} />
                  <span className="text-xs">{item.name}</span>
                </span>
              </div>
            ) : (
              <Link
                key={item.name}
                to={item.url}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  "relative cursor-pointer text-sm font-medium px-6 py-2 rounded-full transition-colors",
                  "text-foreground/80 hover:text-primary",
                  isActive && "bg-muted text-primary"
                )}
              >
                <span className="flex flex-col items-center gap-1">
                  <item.icon size={18} strokeWidth={2.5} />
                  <span className="text-xs">{item.name}</span>
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                      <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                      <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                  </motion.div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
