
import { Home, PiggyBank, Plus, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";

export function MobileNav() {
  const location = useLocation();
  const { currentUser, selectedFund } = useApp();
  
  if (!currentUser) return null;

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home"
    },
    {
      href: selectedFund ? `/funds/${selectedFund.id}` : "/",
      icon: PiggyBank,
      label: "Current Fund"
    },
    {
      href: "/funds/new",
      icon: Plus,
      label: "New Fund"
    }
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background"
    >
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = item.href === location.pathname;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-xs mt-1">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 h-0.5 w-12 bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
