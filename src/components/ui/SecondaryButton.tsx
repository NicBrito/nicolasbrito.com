"use client";

import { cn } from "@/lib/utils";
import { motion, TargetAndTransition } from "framer-motion";
import { ReactNode, forwardRef, Ref } from "react";

export interface SecondaryButtonProps {
  children: ReactNode;
  href?: string;
  target?: string;
  className?: string;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  tabIndex?: number;
  disabled?: boolean;
  download?: boolean | string;
  rel?: string;
  showArrow?: boolean;
  ariaLabel?: string;
}

const TAP_ANIMATION: TargetAndTransition = {
  scale: 0.97,
  transition: { duration: 0.08, ease: "easeInOut" },
};

const BUTTON_BASE_CLASS =
  "inline-flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed font-semibold tracking-tight cursor-pointer";

const BUTTON_SECONDARY_CLASS =
  "bg-white/5 hover:bg-white/10 focus-visible:bg-white/10 text-foreground border border-white/10 backdrop-blur-md shadow-lg shadow-black/5";

export const SecondaryButton = forwardRef<HTMLElement, SecondaryButtonProps>(
  (
    {
      children,
      href,
      target = "_blank",
      className,
      onClick,
      onKeyDown,
      onMouseEnter,
      onMouseLeave,
      tabIndex,
      disabled = false,
      download,
      rel = "noopener noreferrer",
      showArrow = false,
      ariaLabel,
    },
    ref,
  ) => {
  const buttonClass = cn(BUTTON_BASE_CLASS, BUTTON_SECONDARY_CLASS, className);

  const content = (
    <>
      {children}
      {showArrow && (
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1 ml-1">
          ↗
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        download={download}
        rel={rel}
        whileTap={TAP_ANIMATION}
        className={cn(buttonClass, "group gap-3")}
        aria-label={ariaLabel}
        tabIndex={tabIndex ?? (disabled ? -1 : 0)}
        onKeyDown={onKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as Ref<HTMLButtonElement>}
      onClick={onClick}
      disabled={disabled}
      whileTap={TAP_ANIMATION}
      className={cn(buttonClass, "gap-3")}
      aria-label={ariaLabel}
      type="button"
      tabIndex={tabIndex ?? (disabled ? -1 : 0)}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </motion.button>
  );
});

SecondaryButton.displayName = "SecondaryButton";