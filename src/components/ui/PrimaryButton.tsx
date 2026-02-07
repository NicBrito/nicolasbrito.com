"use client";

import { cn } from "@/lib/utils";
import { motion, TargetAndTransition } from "framer-motion";
import { ReactNode } from "react";

export interface PrimaryButtonProps {
  children: ReactNode;
  href?: string;
  target?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  download?: boolean | string;
  rel?: string;
  icon?: ReactNode;
  showArrow?: boolean;
  ariaLabel?: string;
}

const TAP_ANIMATION: TargetAndTransition = {
  scale: 0.97,
  transition: { duration: 0.08, ease: "easeInOut" },
};

const BUTTON_BASE_CLASS =
  "inline-flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed font-semibold tracking-tight cursor-pointer";

const BUTTON_PRIMARY_CLASS =
  "bg-accent text-white hover:bg-accent/90 focus-visible:bg-accent/90 shadow-xl shadow-black/20";

export function PrimaryButton({
  children,
  href,
  target = "_blank",
  className,
  onClick,
  disabled = false,
  download,
  rel = "noopener noreferrer",
  showArrow = false,
  ariaLabel,
}: PrimaryButtonProps) {
  const buttonClass = cn(BUTTON_BASE_CLASS, BUTTON_PRIMARY_CLASS, className);

  const content = (
    <>
      {children}
      {showArrow && (
        <span className="transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1 ml-1">
          →
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        download={download}
        rel={rel}
        whileTap={TAP_ANIMATION}
        className={cn(buttonClass, "group gap-3")}
        aria-label={ariaLabel}
        tabIndex={disabled ? -1 : 0}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={TAP_ANIMATION}
      className={cn(buttonClass, "gap-3")}
      aria-label={ariaLabel}
      type="button"
      tabIndex={disabled ? -1 : 0}
    >
      {content}
    </motion.button>
  );
}