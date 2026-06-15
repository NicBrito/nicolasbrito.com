import type { Variants } from "framer-motion";

export interface GameConfig {
  readonly id: string;
  readonly image?: string;
  readonly colors: { readonly from: string; readonly to: string };
  readonly displayDuration: number;
}

export const GAMES: readonly GameConfig[] = [
  { id: "game-1", colors: { from: "bg-violet-500", to: "bg-fuchsia-500" }, displayDuration: 5000 },
  { id: "game-2", colors: { from: "bg-cyan-500",   to: "bg-blue-600"    }, displayDuration: 5000 },
  { id: "game-3", colors: { from: "bg-amber-500",  to: "bg-orange-600"  }, displayDuration: 5000 },
  { id: "game-4", colors: { from: "bg-emerald-500",to: "bg-teal-600"    }, displayDuration: 5500 },
  { id: "game-5", colors: { from: "bg-rose-500",   to: "bg-pink-600"    }, displayDuration: 5000 },
];

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_IN: [number, number, number, number] = [0.55, 0, 1, 1];
export const EASE_CSS: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
export const EASE_ACCEL: [number, number, number, number] = [0.4, 0, 1, 1];

export const CARD_GAP = 20;
export const MAX_CARD_WIDTH = 1200;
export const HOVER_BLEED = 16;

export const DOT_H         = "clamp(0.5rem, 1vw, 0.625rem)";
export const CONTROL_H     = "clamp(3.5rem, 6vw, 4rem)";
export const ACTIVE_DOT_W  = "clamp(2.5rem, 4vw, 3.5rem)";
export const PILL_VERT_PX  = "clamp(1.5rem, 2.5vw, 1.6875rem)";
export const PILL_HORIZ_PX = "clamp(1.5rem, 2.5vw, 1.75rem)";
export const BTN_GAP       = "clamp(1rem, 2vw, 1.5rem)";

export const CONTROLS_BOTTOM = 32;

export const HOVER_EXIT_MS        = 320;
export const TEXT_EXIT_MS         = HOVER_EXIT_MS + 150;
export const CARD_SETTLE_MS       = 650;
export const TEXT_ENTER_S         = 0.48;
export const TEXT_EXIT_S          = 0.20;
export const INITIAL_TEXT_SHOW_MS = 720;

export const TEXT_SLIDE_X = 20;
export const CONTENT_Y_DEFAULT = 68;

export const CARD_SPRING = {
  type:      "spring" as const,
  stiffness: 280,
  damping:   28,
  mass:      0.9,
};

export const HOVER_UNLOCK_AFTER_SWAP_MS =
  CARD_SETTLE_MS +
  Math.round(TEXT_ENTER_S * 1000) +
  160;

export const GLASS_STYLE: React.CSSProperties = {
  background:           "var(--glass-surface)",
  backdropFilter:       "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
};

export const CARD_VARIANTS: Variants = {
  hidden:  { opacity: 0, y: 40, scale: 1, filter: "blur(3px)" },
  visible: {
    opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
    transition: { duration: 0.88, ease: EASE_OUT },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.28, ease: [0.2, 0, 0.2, 1] },
  },
};

export const CARD_VARIANTS_REDUCED: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  hover:   { scale: 1.01, transition: { duration: 0.2 } },
};

export const ORB_VARIANTS: Variants = {
  hidden:  { opacity: 0, scale: 0.6 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 1.8, delay, ease: [0.2, 0.8, 0.2, 1] },
  }),
};

export const POINTER_QUERY = "(hover: hover) and (pointer: fine)";
