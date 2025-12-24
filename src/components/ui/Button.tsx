"use client";

import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import { forwardRef } from "react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "link";
  size?: "sm" | "md" | "lg" | "xl";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary: "bg-accent text-white hover:opacity-90 shadow-sm",
      secondary: "bg-surface text-accent hover:bg-black/5 dark:hover:bg-white/10",
      outline: "border-2 border-accent text-accent bg-transparent hover:bg-accent/5",
      link: "bg-transparent text-accent hover:underline decoration-1 underline-offset-4",
    };

    const sizes = {
      sm: "px-4 py-1 text-xs",
      md: "px-6 py-2 text-sm",
      lg: "px-8 py-2.5 text-[17px] font-semibold",
      xl: "px-10 py-4 text-lg font-semibold tracking-tight min-w-[160px] md:min-w-[200px]",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";