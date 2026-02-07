"use client";

import { cn } from "@/lib/utils";
import { motion, TargetAndTransition } from "framer-motion";
import { ReactNode } from "react";

export interface SocialLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  className?: string;
  target?: string;
  rel?: string;
  iconSize?: number;
}

const BASE_CLASS = "group relative p-4 rounded-[22%] bg-gradient-to-br from-white/10 to-white/5 border border-white/15 text-foreground/70 hover:text-white focus-visible:text-white hover:from-white/15 hover:to-white/10 focus-visible:from-white/15 focus-visible:to-white/10 transition-colors duration-200 backdrop-blur-md shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] focus-visible:shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden cursor-pointer";

const TAP_ANIMATION: TargetAndTransition = {
  scale: 0.97,
  transition: { duration: 0.08, ease: "easeInOut" },
};

const INTERACTION_ANIMATION: TargetAndTransition = {
  scale: 1.05,
  transition: { duration: 0.2, ease: "easeOut" },
};

export function SocialLink({
  href,
  icon,
  label,
  className,
  target = "_blank",
  rel = "noreferrer",
}: SocialLinkProps) {
  return (
    <motion.a
      href={href}
      target={target}
      rel={rel}
      className={cn(BASE_CLASS, className)}
      aria-label={label}
      tabIndex={0}
      whileTap={TAP_ANIMATION}
      whileHover={INTERACTION_ANIMATION}
      whileFocus={INTERACTION_ANIMATION}
    >
      <div className="group-hover:scale-110 group-focus-visible:scale-110 transition-transform duration-200 relative z-10">
        {icon}
      </div>
    </motion.a>
  );
}