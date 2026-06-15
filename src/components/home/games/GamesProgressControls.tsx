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
  GLASS_STYLE,
  PILL_HORIZ_PX,
  PILL_VERT_PX,
  POINTER_QUERY,
} from "./constants";

const wrapperSpring = { type: "spring" as const, stiffness: 260, damping: 24, mass: 0.8 };
const pillSpring    = { type: "spring" as const, stiffness: 320, damping: 28, mass: 0.7 };
const btnSpring     = { type: "spring" as const, stiffness: 280, damping: 22, mass: 0.7 };

export interface GamesProgressControlsProps {
  currentIndex:  number;
  totalCards:    number;
  isPlaying:     boolean;
  isVisible:     boolean;
  fillRef:       React.RefObject<HTMLDivElement | null>;
  onGoTo:        (index: number) => void;
  onTogglePlay:  () => void;
  playLabel:     string;
  pauseLabel:    string;
  goToLabel:     string;
  carouselLabel: string;
  onFocusPrimaryBtn: (idx?: number) => void;
  onAdvanceNext: () => void;
}

export function GamesProgressControls({
  currentIndex, totalCards, isPlaying,
  fillRef, isVisible, onGoTo, onTogglePlay,
  playLabel, pauseLabel, goToLabel, carouselLabel,
  onFocusPrimaryBtn, onAdvanceNext,
}: GamesProgressControlsProps) {
  const dotsRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const reduced  = useReducedMotion();
  const hasPointer = useMediaQuery(POINTER_QUERY);

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
            initial={{ opacity: 0, scale: reduced ? 1 : 0.05 }}
            animate={{
              opacity: 1, scale: 1,
              transition: {
                opacity: { duration: 0.28, ease: "easeOut" },
                scale:   reduced ? { duration: 0 } : wrapperSpring,
              },
            }}
            exit={{
              opacity: 0,
              scale:   reduced ? 1 : 0.05,
              transition: {
                opacity:  { duration: 0.28, ease: EASE_IN, delay: 0.38 },
                scale:    reduced ? { duration: 0 } : { duration: 0.28, ease: EASE_IN, delay: 0.38 },
              },
            }}
            className="flex items-center"
            style={{ gap: BTN_GAP, transformOrigin: "center bottom", pointerEvents: "none" }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scaleX: reduced ? 1 : 0.04,
                backdropFilter: "blur(0px)",
              }}
              animate={{
                opacity: 1, scaleX: 1,
                backdropFilter: "blur(28px)",
                transition: {
                  opacity: { duration: 0.22, ease: "easeOut", delay: 0.14 },
                  scaleX:  reduced ? { duration: 0 } : { ...pillSpring, delay: 0.14 },
                  backdropFilter: { duration: 0.22, ease: "easeOut", delay: 0.14 },
                },
              }}
              exit={{
                scaleX: reduced ? 1 : 0.04,
                opacity: 0,
                backdropFilter: "blur(0px)",
                transition: {
                  scaleX:  reduced ? { duration: 0 } : { duration: 0.28, ease: EASE_IN, delay: 0.24 },
                  opacity: { duration: 0.22, ease: EASE_IN, delay: 0.24 },
                  backdropFilter: { duration: 0.22, ease: EASE_IN, delay: 0.24 },
                },
              }}
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
                gap:             hasPointer ? "clamp(0.5rem, 1vw, 0.625rem)" : "clamp(1rem, 2vw, 1.25rem)",
                transformOrigin: "center center",
              }}
              role="tablist"
              aria-label={carouselLabel}
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

            <motion.button
              ref={playBtnRef}
              initial={{
                opacity: 0,
                scale: reduced ? 1 : 0.2,
                x: reduced ? 0 : -66,
                backdropFilter: "blur(0px)",
              }}
              animate={{
                opacity: 1, scale: 1, x: 0,
                backdropFilter: "blur(28px)",
                transition: {
                  opacity: { duration: 0.05, ease: "linear", delay: 0.35 },
                  scale:   reduced ? { duration: 0 } : { ...btnSpring, delay: 0.38 },
                  x:       reduced ? { duration: 0 } : { ...btnSpring, delay: 0.38 },
                  backdropFilter: { duration: 0.05, ease: "linear", delay: 0.35 },
                },
              }}
              exit={{
                opacity: 0,
                scale:   reduced ? 1 : 0,
                x:       reduced ? 0 : -66,
                backdropFilter: "blur(0px)",
                transition: {
                  opacity: { duration: 0.22, ease: EASE_IN },
                  scale:   reduced ? { duration: 0 } : { duration: 0.28, ease: EASE_IN },
                  x:       reduced ? { duration: 0 } : { duration: 0.28, ease: EASE_IN },
                  backdropFilter: { duration: 0.22, ease: EASE_IN },
                },
              }}
              onClick={onTogglePlay}
              onKeyDown={handlePlayBtnKeyDown}
              tabIndex={-1}
              aria-label={isPlaying ? pauseLabel : playLabel}
              className="flex-shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-[filter] duration-200 hover:brightness-125 active:brightness-75"
              style={{
                ...GLASS_STYLE,
                pointerEvents:  "auto",
                display:        "flex",
                zIndex:          5,
                width:           CONTROL_H,
                height:          CONTROL_H,
                borderRadius:    "50%",
                border:          "none",
                cursor:          "pointer",
                transformOrigin: "left center",
              }}
            >
              {isPlaying
                ? <Pause size={20} fill="var(--carousel-icon)" stroke="none" strokeWidth={0} />
                : <Play  size={20} fill="var(--carousel-icon)" stroke="none" strokeWidth={0} style={{ transform: "translateX(1.5px)" }} />
              }
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
