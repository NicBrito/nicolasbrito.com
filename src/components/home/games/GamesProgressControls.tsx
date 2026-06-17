"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useRef } from "react";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import {
  ACTIVE_DOT_W,
  BTN_GAP,
  CONTROL_H,
  CONTROLS_BOTTOM,
  DOT_H,
  EASE_IN,
  EASE_OUT,
  GLASS_STYLE,
  PILL_HORIZ_PX,
  PILL_VERT_PX,
  POINTER_QUERY,
} from "./constants";

const btnSpring      = { type: "spring" as const, stiffness: 280, damping: 24, mass: 0.7 };
const BTN_RETREAT_X  = -80;

// At scaleX ≈ 0.35 the pill width (≈ 9.5–12 rem × 0.35 ≈ 3.3–4.2 rem) matches its height
// (≈ 3.5–4 rem), producing a near-perfect circle across viewport sizes.
const CIRCLE_SCALE_X = 0.35;

// Entry keyframe: [circle materializes] → [visible hold ~117 ms] → [bar expands]
// Wrapper rises over 0.4 s so the circle is clearly seen rising before expanding.
const PILL_ENTRY_S = 0.9;
const PILL_TIMES: [number, number, number, number] = [0, 0.15, 0.28, 1];

// Entry delays (seconds from mount)
const DOTS_APPEAR_S = 0.27;  // dots fade in as bar begins expanding (after hold ends)
const BTN_EMERGE_S  = 0.52;  // button x spring
const BTN_FADE_IN_S = 0.58;  // button opacity

// Exit delays (seconds from exit trigger)
// Sequence: dots(0s) → button(0.1s) → pill(0.24s) → wrapper(0.4s)
const BTN_EXIT_S    = 0.10;
const PILL_EXIT_S   = 0.24;
const WRAP_EXIT_Y_S = 0.40;
const WRAP_EXIT_O_S = 0.42;

export interface GamesProgressControlsProps {
  currentIndex:      number;
  totalCards:        number;
  isPlaying:         boolean;
  isVisible:         boolean;
  fillRef:           React.RefObject<HTMLDivElement | null>;
  onGoTo:            (index: number) => void;
  onTogglePlay:      () => void;
  playLabel:         string;
  pauseLabel:        string;
  goToLabel:         string;
  carouselLabel:     string;
  onFocusPrimaryBtn: (idx?: number) => void;
  onAdvanceNext:     () => void;
}

export function GamesProgressControls({
  currentIndex, totalCards, isPlaying,
  fillRef, isVisible, onGoTo, onTogglePlay,
  playLabel, pauseLabel, goToLabel, carouselLabel,
  onFocusPrimaryBtn, onAdvanceNext,
}: GamesProgressControlsProps) {
  const dotsRefs   = useRef<(HTMLButtonElement | null)[]>([]);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const reduced    = useReducedMotion();
  const hasPointer = useMediaQuery(POINTER_QUERY);
  const dotsGap    = hasPointer ? "clamp(0.5rem, 1vw, 0.625rem)" : "clamp(1rem, 2vw, 1.25rem)";

  const handleDotKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (idx < totalCards - 1) dotsRefs.current[idx + 1]?.focus();
      else playBtnRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (idx > 0) dotsRefs.current[idx - 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      onGoTo(idx);
      onFocusPrimaryBtn(idx);
    } else if (e.key === " ") {
      e.preventDefault();
      onTogglePlay();
      onFocusPrimaryBtn();
    } else if (e.key === "Escape" || e.key === "ArrowUp") {
      e.preventDefault();
      onFocusPrimaryBtn();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onAdvanceNext();
    }
  };

  const handlePlayBtnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      dotsRefs.current[totalCards - 1]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTogglePlay();
      onFocusPrimaryBtn();
    } else if (e.key === "Escape" || e.key === "ArrowUp") {
      e.preventDefault();
      onFocusPrimaryBtn();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onAdvanceNext();
    }
  };

  return (
    <div
      style={{
        position:       "sticky",
        bottom:         CONTROLS_BOTTOM,
        left:           0,
        width:          "100%",
        zIndex:         50,
        display:        "flex",
        justifyContent: "center",
        alignItems:     "center",
        pointerEvents:  "none",
      }}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="controls-wrapper"
            initial={{ opacity: 0, y: reduced ? 0 : 64 }}
            animate={{
              opacity: 1,
              y:       0,
              transition: {
                opacity: { duration: 0.28, ease: "easeOut" },
                y:       reduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT },
              },
            }}
            exit={{
              opacity: 0,
              y:       reduced ? 0 : 64,
              transition: {
                y:       reduced ? { duration: 0 } : { duration: 0.3, ease: EASE_IN, delay: WRAP_EXIT_Y_S },
                opacity: { duration: 0.22, ease: EASE_IN, delay: WRAP_EXIT_O_S },
              },
            }}
            className="flex items-center"
            style={{ gap: BTN_GAP, pointerEvents: "none" }}
          >
            {/*
              Pill — 3-phase entry via keyframe scaleX:
                Phase 1 [0 → 0.135s]: circle materializes  (scaleX 0 → CIRCLE_SCALE_X ≈ 0.35)
                Phase 2 [0.135 → 0.252s]: visible hold (117 ms) — circle seen rising with wrapper
                Phase 3 [0.252 → 0.9s]: bar expands (EASE_OUT — fast start, decelerates)
              Exit: contracts back to circle after button retreated (delay PILL_EXIT_S).
            */}
            <motion.div
              initial={{
                opacity:        0,
                scaleX:         reduced ? 1 : 0,
                scaleY:         reduced ? 1 : 0,
                backdropFilter: "blur(0px)",
              }}
              animate={reduced
                ? {
                    opacity:        1,
                    backdropFilter: "blur(28px)",
                    transition: {
                      opacity:        { duration: 0.3,  ease: "easeOut" },
                      backdropFilter: { duration: 0.35, ease: "easeOut" },
                    },
                  }
                : {
                    opacity:        1,
                    scaleX:         [0, CIRCLE_SCALE_X, CIRCLE_SCALE_X, 1],
                    scaleY:         1,
                    backdropFilter: "blur(28px)",
                    transition: {
                      opacity:        { duration: 0.14, ease: "easeOut" },
                      scaleX:         {
                        duration: PILL_ENTRY_S,
                        times:    PILL_TIMES,
                        ease:     ["easeOut", "linear", EASE_OUT],
                      },
                      scaleY:         { duration: 0.2, ease: EASE_OUT },
                      backdropFilter: { duration: 0.3, ease: "easeOut" },
                    },
                  }
              }
              exit={reduced
                ? {
                    opacity:    0,
                    transition: { opacity: { duration: 0.2, ease: EASE_IN } },
                  }
                : {
                    scaleX: CIRCLE_SCALE_X,
                    transition: {
                      scaleX: { duration: 0.18, ease: EASE_IN, delay: PILL_EXIT_S },
                    },
                  }
              }
              style={{
                ...GLASS_STYLE,
                pointerEvents:   "auto",
                zIndex:          10,
                display:         "flex",
                alignItems:      "center",
                borderRadius:    9999,
                paddingTop:      PILL_VERT_PX,
                paddingBottom:   PILL_VERT_PX,
                paddingLeft:     hasPointer ? PILL_HORIZ_PX : "clamp(1.75rem, 3vw, 2.25rem)",
                paddingRight:    hasPointer ? PILL_HORIZ_PX : "clamp(1.75rem, 3vw, 2.25rem)",
                transformOrigin: "center center",
              }}
              role="tablist"
              aria-label={carouselLabel}
            >
              {/*
                Dots wrapper — independent opacity layer.
                Entry: fades in (delay DOTS_APPEAR_S) as bar starts expanding.
                Exit: fades out immediately (delay 0) — FIRST step of exit sequence.
              */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity:    1,
                  transition: { duration: 0.2, ease: "easeOut", delay: DOTS_APPEAR_S },
                }}
                exit={{
                  opacity:    0,
                  transition: { duration: 0.14, ease: EASE_IN },
                }}
                style={{ display: "flex", alignItems: "center", gap: dotsGap }}
              >
                {Array.from({ length: totalCards }).map((_, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={idx}
                      id={`game-dot-${idx}`}
                      ref={(el) => { dotsRefs.current[idx] = el; }}
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`${goToLabel} ${idx + 1}`}
                      onClick={() => onGoTo(idx)}
                      onKeyDown={(e) => handleDotKeyDown(e, idx)}
                      tabIndex={-1}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-[filter,width,background-color] duration-200 hover:brightness-125 active:brightness-75"
                      style={{
                        position:     "relative",
                        height:       DOT_H,
                        width:        isActive ? ACTIVE_DOT_W : DOT_H,
                        borderRadius: 9999,
                        overflow:     "hidden",
                        border:       "none",
                        cursor:       "pointer",
                        background:   isActive
                          ? "var(--carousel-dot-active)"
                          : "var(--carousel-dot)",
                      }}
                    >
                      {isActive && (
                        <div
                          ref={fillRef}
                          style={{
                            position:     "absolute",
                            top:          0,
                            bottom:       0,
                            left:         0,
                            width:        0,
                            borderRadius: 9999,
                            background:   "var(--carousel-fill)",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </motion.div>

            {/*
              Button — hidden at BTN_RETREAT_X behind the pill (zIndex 5 < 10).
              Entry: springs out when bar is nearly full (delay BTN_EMERGE_S).
              Exit: retreats after dots started fading (delay BTN_EXIT_S).
            */}
            <motion.button
              ref={playBtnRef}
              initial={{
                opacity:        0,
                x:              reduced ? 0 : BTN_RETREAT_X,
                backdropFilter: "blur(0px)",
              }}
              animate={reduced
                ? {
                    opacity:    1,
                    transition: { opacity: { duration: 0.25, ease: "easeOut", delay: 0.3 } },
                  }
                : {
                    opacity:        1,
                    x:              0,
                    backdropFilter: "blur(28px)",
                    transition: {
                      opacity:        { duration: 0.2, ease: "easeOut", delay: BTN_FADE_IN_S },
                      x:              { ...btnSpring,  delay: BTN_EMERGE_S },
                      backdropFilter: { duration: 0.2, ease: "easeOut", delay: BTN_FADE_IN_S },
                    },
                  }
              }
              exit={{
                opacity:        0,
                x:              reduced ? 0 : BTN_RETREAT_X,
                backdropFilter: "blur(0px)",
                transition: {
                  opacity:        { duration: 0.14, ease: EASE_IN, delay: BTN_EXIT_S },
                  x:              reduced ? { duration: 0 } : { duration: 0.17, ease: EASE_IN, delay: BTN_EXIT_S },
                  backdropFilter: { duration: 0.14, ease: EASE_IN, delay: BTN_EXIT_S },
                },
              }}
              onClick={onTogglePlay}
              onKeyDown={handlePlayBtnKeyDown}
              tabIndex={-1}
              aria-label={isPlaying ? pauseLabel : playLabel}
              className="flex-shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-[filter] duration-200 hover:brightness-125 active:brightness-75"
              style={{
                ...GLASS_STYLE,
                pointerEvents:   "auto",
                display:         "flex",
                zIndex:          5,
                width:           CONTROL_H,
                height:          CONTROL_H,
                borderRadius:    "50%",
                border:          "none",
                cursor:          "pointer",
                transformOrigin: "center center",
              }}
            >
              {/*
                Icon: scale+opacity cross-dissolve on play↔pause toggle (mode="wait").
                On exit: icon shrinks+fades at t=0, before button glass retreats at t=BTN_EXIT_S.
                initial={false} omitted so Framer Motion propagates outer exit into this span.
              */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={isPlaying ? "pause" : "play"}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.26, ease: EASE_OUT } }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.18, ease: EASE_IN } }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {isPlaying
                    ? <Pause size={20} fill="var(--carousel-icon)" stroke="none" strokeWidth={0} />
                    : <Play  size={20} fill="var(--carousel-icon)" stroke="none" strokeWidth={0} style={{ transform: "translateX(1.5px)" }} />
                  }
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
