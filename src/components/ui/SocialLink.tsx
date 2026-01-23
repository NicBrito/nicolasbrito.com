"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export interface SocialLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  className?: string;
  target?: string;
  rel?: string;
  iconSize?: number;
  onHover?: () => void;
}

const BASE_CLASS = "group relative p-4 rounded-[22%] bg-gradient-to-br from-white/10 to-white/5 border border-white/15 text-foreground/70 hover:text-white hover:from-white/15 hover:to-white/10 transition-colors duration-300 backdrop-blur-md shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden";

export function SocialLink({
  href,
  icon,
  label,
  className,
  target = "_blank",
  rel = "noreferrer",
  onHover,
}: SocialLinkProps) {
  return (
    <motion.a
      href={href}
      target={target}
      rel={rel}
      className={cn(BASE_CLASS, className)}
      aria-label={label}
      onHoverStart={onHover}
      whileHover={{
        transition: { type: "spring", stiffness: 400, damping: 20 },
      }}
    >
      <div className="group-hover:scale-110 transition-transform duration-300 relative z-10">
        {icon}
      </div>
    </motion.a>
  );
}