import type { Variants } from "framer-motion";

/* ============================================================================
 * Games carousel — single source of truth for data, motion, and interaction.
 * Tune the section's feel from the top of this file; nothing below is inlined
 * in components. Durations are in seconds (Framer) or ms (timers), as labelled.
 * ========================================================================== */

// ─── Data ────────────────────────────────────────────────────────────────────

export interface GameConfig {
  readonly id: string;
  readonly image?: string;
  readonly colors: { readonly from: string; readonly to: string };
  /** Autoplay dwell time on this card before advancing (ms). */
  readonly displayDuration: number;
}

export const GAMES: readonly GameConfig[] = [
  { id: "game-1", colors: { from: "bg-violet-500",  to: "bg-fuchsia-500" }, displayDuration: 5000 },
  { id: "game-2", colors: { from: "bg-cyan-500",    to: "bg-blue-600"    }, displayDuration: 5000 },
  { id: "game-3", colors: { from: "bg-amber-500",   to: "bg-orange-600"  }, displayDuration: 5000 },
  { id: "game-4", colors: { from: "bg-emerald-500", to: "bg-teal-600"    }, displayDuration: 5500 },
  { id: "game-5", colors: { from: "bg-rose-500",    to: "bg-pink-600"    }, displayDuration: 5000 },
];

/** Stable per-card durations array — referenced by the autoplay hook's effect. */
export const GAME_DURATIONS: readonly number[] = GAMES.map((g) => g.displayDuration);

// ─── Easings (custom cubic-bezier — never default springs) ───────────────────

export const EASE_OUT:   [number, number, number, number] = [0.22, 1,   0.36, 1]; // decelerate
export const EASE_IN:    [number, number, number, number] = [0.55, 0,   1,    1]; // accelerate
export const EASE_CSS:   [number, number, number, number] = [0.25, 0.1, 0.25, 1]; // standard
export const EASE_ACCEL: [number, number, number, number] = [0.4,  0,   1,    1]; // sharp exit

// ─── Layout & dimensions (8-point grid) ──────────────────────────────────────

export const CARD_GAP       = 20;
export const MAX_CARD_WIDTH = 1200;
export const HOVER_BLEED     = 16; // overflow padding so hover scale isn't clipped

/** Side-peek of neighbouring cards: flat on mobile, ratio-scaled then capped. */
export const CARD_PEEK_MOBILE_PX = 24;
export const CARD_PEEK_RATIO     = 0.08;
export const CARD_PEEK_MAX_PX    = 120;
export const CARD_PEEK_BREAKPOINT = 640;

export const DOT_H         = "clamp(0.5rem, 1vw, 0.625rem)";
export const CONTROL_H     = "clamp(3.5rem, 6vw, 4rem)";
export const ACTIVE_DOT_W  = "clamp(2.5rem, 4vw, 3.5rem)";
export const PILL_VERT_PX  = "clamp(1.5rem, 2.5vw, 1.6875rem)";
export const PILL_HORIZ_PX = "clamp(1.5rem, 2.5vw, 1.75rem)";
export const BTN_GAP       = "clamp(1rem, 2vw, 1.5rem)";
export const CONTROLS_BOTTOM = 32;

export const TEXT_SLIDE_X      = 20; // px the heading/body slide in on card change
export const CONTENT_Y_DEFAULT = 68; // px the content column rests below baseline (pointer)

// ─── Timings ─────────────────────────────────────────────────────────────────

export const CARD_SETTLE_MS       = 650;  // delay before re-showing text after a swap
export const TEXT_ENTER_S         = 0.48;
export const TEXT_EXIT_S          = 0.20;
export const INITIAL_TEXT_SHOW_MS = 720;  // first text reveal after the section starts

// Manual move exit choreography: text slides+fades immediately in the carousel
// direction; buttons follow with a short stagger (as if pulled by the text).
// Both are fast — the swap already commits synchronously, so the exit just needs
// to feel purposeful, not leisurely.
export const MANUAL_TEXT_EXIT_S    = 0.15; // text exit duration (s)
export const BTN_EXIT_STAGGER_S    = 0.06; // buttons start this long after text (s)
/** Hover lock after a manual swap — covers only the spring animation (~300ms). */
export const MANUAL_HOVER_UNLOCK_MS = 500;

// Staged exit choreography for a deliberate navigation — the outgoing card
// finishes leaving before it is replaced, so the swap reads as one motion:
//   t = 0 .............. hover lifts off: actions exit, content returns to rest
//   t = HOVER_EXIT_MS .. text slides out with a fade in the travel direction
//   t = TEXT_EXIT_MS ... the track advances to the next card
export const HOVER_EXIT_MS = 320;
export const TEXT_EXIT_MS  = 470;

/** Hover stays locked through a swap until the new card's text has fully entered. */
export const HOVER_UNLOCK_AFTER_SWAP_MS =
  CARD_SETTLE_MS + Math.round(TEXT_ENTER_S * 1000) + 160;

// ─── Interaction (pointer / touch / keyboard navigation) ─────────────────────

export const PAN_DISTANCE_PX  = 40;   // min horizontal drag offset to page one card
export const PAN_VELOCITY_PXS = 350;  // …or min flick velocity (px/s)
export const SWIPE_LOCK_MS    = 200;  // re-entrancy guard after a pan fires
export const FOCUS_DELAY_MS   = 50;   // defer focus() until layout has settled

// ─── Springs ─────────────────────────────────────────────────────────────────

/** Track translation. A configured (non-default) spring — snappy but settled. */
export const CARD_SPRING = {
  type:      "spring" as const,
  stiffness: 280,
  damping:   28,
  mass:      0.9,
};

// ─── Variants ────────────────────────────────────────────────────────────────

export const CARD_STAGGER_S = 0.22;

export const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 68 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.68, ease: "easeOut", delay },
      y:       { duration: 0.9,  ease: EASE_OUT,  delay },
    },
  }),
  rest:  { scale: 1,    transition: { duration: 0.28, ease: [0.2, 0, 0.2, 1] } },
  hover: { scale: 1.02, transition: { duration: 0.28, ease: [0.2, 0, 0.2, 1] } },
};

export const CARD_VARIANTS_REDUCED: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.3, delay },
  }),
  rest:  { scale: 1,    transition: { duration: 0.2 } },
  hover: { scale: 1.01, transition: { duration: 0.2 } },
};

export const ORB_VARIANTS: Variants = {
  hidden:  { opacity: 0, scale: 0.6 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 1.8, delay, ease: [0.2, 0.8, 0.2, 1] },
  }),
};

// ─── Surfaces & queries ──────────────────────────────────────────────────────

export const GLASS_STYLE: React.CSSProperties = {
  background:           "var(--glass-surface)",
  backdropFilter:       "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
};

export const POINTER_QUERY = "(hover: hover) and (pointer: fine)";
