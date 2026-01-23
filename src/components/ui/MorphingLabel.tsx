"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, Variants } from "framer-motion";

export interface MorphingLabelProps {
  text: string;
  layoutIdPrefix: string;
  className?: string;
  animationDuration?: {
    animate?: number;
    exit?: number;
  };
}
const createLetterVariants = (duration: {
  animate: number;
  exit: number;
}): Variants => ({
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: duration.animate,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.exit,
      ease: "easeIn",
    },
  },
});
export function MorphingLabel({
  text,
  className,
  layoutIdPrefix,
  animationDuration = { animate: 0.2, exit: 0.15 },
}: MorphingLabelProps) {
  const characters = text.split("");
  const letterVariants = createLetterVariants({
    animate: animationDuration.animate ?? 0.2,
    exit: animationDuration.exit ?? 0.15,
  });

  return (
    <div className={cn("inline-flex whitespace-nowrap", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {characters.map((char, i) => (
          <motion.span
            key={`${layoutIdPrefix}-${i}-${char}`}
            variants={letterVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout="position"
            className="inline-block whitespace-pre"
          >
            {char}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}