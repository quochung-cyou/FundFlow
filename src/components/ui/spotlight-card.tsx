"use client";

import { useRef, useState, useEffect } from "react";

export const SpotlightCard = ({
  children,
  className = "",
  spotlightColor = "#6300ff30",
  size = "large",
  fullHeight = false,
  showCounter = false,
  counterValue = 0,
  animated = true,
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  size?: "small" | "default" | "large";
  fullHeight?: boolean;
  showCounter?: boolean;
  counterValue?: number;
  animated?: boolean;
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [animatedCounter, setAnimatedCounter] = useState(0);

  // Animate counter
  useEffect(() => {
    if (!showCounter || !animated) {
      setAnimatedCounter(counterValue);
      return;
    }

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = counterValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= counterValue) {
        setAnimatedCounter(counterValue);
        clearInterval(timer);
      } else {
        setAnimatedCounter(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [counterValue, showCounter, animated]);

  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!divRef.current || isFocused) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(0.6);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  // Enhanced padding and spacing based on size
  const getSpacing = () => {
    switch (size) {
      case "small":
        return {
          padding: "p-4 sm:p-5",
          gap: "gap-3",
          textSize: "text-sm",
          titleSize: "text-lg sm:text-xl",
          counterSize: "text-2xl sm:text-3xl",
        };
      case "large":
        return {
          padding: "p-8 sm:p-10 lg:p-12",
          gap: "gap-6 sm:gap-8",
          textSize: "text-base sm:text-lg",
          titleSize: "text-2xl sm:text-3xl lg:text-4xl",
          counterSize: "text-4xl sm:text-5xl lg:text-6xl",
        };
      default:
        return {
          padding: "p-6 sm:p-8",
          gap: "gap-4 sm:gap-6",
          textSize: "text-sm sm:text-base",
          titleSize: "text-xl sm:text-2xl lg:text-3xl",
          counterSize: "text-3xl sm:text-4xl lg:text-5xl",
        };
    }
  };

  const spacing = getSpacing();

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative rounded-xl border border-neutral-200 dark:border-neutral-800 
        bg-white dark:bg-neutral-900 overflow-hidden 
        ${spacing.padding} ${fullHeight ? "h-full" : "min-h-48 sm:min-h-64"} 
        transition-all duration-300 ease-in-out
        hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-800/50
        hover:border-neutral-300 dark:hover:border-neutral-700
        ${className}
      `}
    >
      {/* Enhanced spotlight effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      
      {/* Subtle gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-neutral-50/30 dark:to-neutral-800/30" />
      
      {/* Counter display */}
      {showCounter && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-200/30 dark:border-purple-700/30 backdrop-blur-sm">
            <span className={`font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ${spacing.counterSize.split(' ')[0]} sm:${spacing.counterSize.split(' ')[1] || spacing.counterSize.split(' ')[0]}`}>
              {animated ? animatedCounter.toLocaleString() : counterValue.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Main content area with better spacing */}
      <div className={`relative h-full flex flex-col justify-between ${spacing.gap}`}>
        {/* Content wrapper with enhanced typography */}
        <div className={`flex-1 flex flex-col ${spacing.gap}`}>
          {children}
        </div>
        
        {/* Bottom accent line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent opacity-50" />
      </div>

      {/* Corner accent */}
      <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-purple-500/10 to-transparent rounded-tr-full" />
      </div>
    </div>
  );
};

// Enhanced wrapper component for better content structure
export const SpotlightCardContent = ({
  title,
  description,
  badge,
  children,
  size = "default",
}: {
  title?: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
  size?: "small" | "default" | "large";
}) => {
  const getTextSizes = () => {
    switch (size) {
      case "small":
        return {
          title: "text-lg sm:text-xl",
          description: "text-sm sm:text-base",
          badge: "text-xs",
        };
      case "large":
        return {
          title: "text-2xl sm:text-3xl lg:text-4xl",
          description: "text-base sm:text-lg lg:text-xl",
          badge: "text-sm",
        };
      default:
        return {
          title: "text-xl sm:text-2xl lg:text-3xl",
          description: "text-sm sm:text-base lg:text-lg",
          badge: "text-xs sm:text-sm",
        };
    }
  };

  const textSizes = getTextSizes();

  return (
    <div className="h-full flex flex-col justify-between gap-4 sm:gap-6">
      {/* Header section */}
      <div className="space-y-3 sm:space-y-4">
        {badge && (
          <div className="inline-flex items-center">
            <span className={`
              px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 
              dark:from-purple-900/30 dark:to-blue-900/30 
              border border-purple-200/50 dark:border-purple-700/50
              text-purple-700 dark:text-purple-300 font-medium
              ${textSizes.badge}
            `}>
              {badge}
            </span>
          </div>
        )}
        
        {title && (
          <h3 className={`
            font-bold text-neutral-900 dark:text-neutral-100 
            leading-tight tracking-tight
            ${textSizes.title}
          `}>
            {title}
          </h3>
        )}
        
        {description && (
          <p className={`
            text-neutral-600 dark:text-neutral-400 
            leading-relaxed
            ${textSizes.description}
          `}>
            {description}
          </p>
        )}
      </div>

      {/* Custom content */}
      {children && (
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      )}

      {/* Bottom section with pulse indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Active
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 ${
                i === 2 ? 'animate-pulse' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};