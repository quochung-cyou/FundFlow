import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  badge?: number | boolean
  disabled?: boolean
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  variant?: "bottom" | "top" | "left" | "right"
  showLabels?: boolean
  glowIntensity?: "low" | "medium" | "high"
}

export function NavBar({ 
  items, 
  className, 
  variant = "bottom", 
  showLabels = true,
  glowIntensity = "medium" 
}: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Set initial value
    handleResize()
    
    // Add event listener
    window.addEventListener("resize", handleResize)
    
    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Determine position classes based on variant
  const positionClasses = {
    bottom: "fixed bottom-0 left-1/2 -translate-x-1/2 mb-6",
    top: "fixed top-0 left-1/2 -translate-x-1/2 mt-6",
    left: "fixed left-0 top-1/2 -translate-y-1/2 ml-6 flex-col",
    right: "fixed right-0 top-1/2 -translate-y-1/2 mr-6 flex-col"
  }

  // Determine glow intensity
  const glowStyles = {
    low: {
      primary: "bg-primary/5",
      blur: "bg-primary/10",
      size: "w-6 h-0.5"
    },
    medium: {
      primary: "bg-primary/10",
      blur: "bg-primary/20",
      size: "w-8 h-1"
    },
    high: {
      primary: "bg-primary/15",
      blur: "bg-primary/30",
      size: "w-10 h-1.5"
    }
  }

  const isVertical = variant === "left" || variant === "right"

  return (
    <div
      className={cn(
        "z-50",
        positionClasses[variant],
        className,
      )}
    >
      <div className={cn(
        "flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg",
        isVertical && "flex-col py-2"
      )}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              to={item.disabled ? "#" : item.url}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                  return;
                }
                setActiveTab(item.name);
              }}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-muted text-primary",
                isVertical && "w-full flex justify-center items-center",
                item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              <span className={cn(
                isMobile && !showLabels ? "hidden" : "inline-flex items-center gap-2",
                (!showLabels && !isMobile) && "hidden"
              )}>
                {!isVertical && <Icon size={18} strokeWidth={2.5} className="inline" />}
                {item.name}
                {item.badge && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                    {typeof item.badge === 'number' ? item.badge : ''}
                  </span>
                )}
              </span>
              
              <span className={cn(
                (isMobile || !showLabels) && !isVertical ? "inline-flex" : "hidden",
                isVertical && "inline-flex"
              )}>
                <Icon size={18} strokeWidth={2.5} />
              </span>
              
              {isActive && (
                <motion.div
                  layoutId={`lamp-${variant}`}
                  className={cn(
                    "absolute inset-0 w-full rounded-full -z-10",
                    glowStyles[glowIntensity].primary
                  )}
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Glow effect positioning based on variant */}
                  <div className={cn(
                    "absolute left-1/2 -translate-x-1/2",
                    glowStyles[glowIntensity].size,
                    variant === "bottom" ? "-top-2 rounded-t-full" : 
                    variant === "top" ? "-bottom-2 rounded-b-full" : 
                    variant === "left" ? "-right-2 rounded-r-full w-1 h-8" : 
                    "-left-2 rounded-l-full w-1 h-8",
                    glowStyles[glowIntensity].primary
                  )}>
                    {/* Glow effects */}
                    <div className={cn(
                      "absolute rounded-full blur-md",
                      glowStyles[glowIntensity].blur,
                      variant === "bottom" || variant === "top" 
                        ? "w-12 h-6 -top-2 -left-2" 
                        : "h-12 w-6 -left-2 -top-2"
                    )} />
                    <div className={cn(
                      "absolute rounded-full blur-md",
                      glowStyles[glowIntensity].blur,
                      variant === "bottom" || variant === "top" 
                        ? "w-8 h-6 -top-1" 
                        : "h-8 w-6 -left-1"
                    )} />
                    <div className={cn(
                      "absolute rounded-full blur-sm",
                      glowStyles[glowIntensity].blur,
                      variant === "bottom" || variant === "top" 
                        ? "w-4 h-4 top-0 left-2" 
                        : "h-4 w-4 left-0 top-2"
                    )} />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
