"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, Variants, useReducedMotion } from "framer-motion";
import { ImageIcon, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

interface GameConfig {
  readonly id: string;
  readonly image?: string;
  readonly colors: { readonly from: string; readonly to: string };
  readonly displayDuration: number;
}

const GAMES: readonly GameConfig[] = [
  { id: "game-1", colors: { from: "bg-violet-500", to: "bg-fuchsia-500" }, displayDuration: 5000 },
  { id: "game-2", colors: { from: "bg-cyan-500",   to: "bg-blue-600"    }, displayDuration: 5000 },
  { id: "game-3", colors: { from: "bg-amber-500",  to: "bg-orange-600"  }, displayDuration: 5000 },
  { id: "game-4", colors: { from: "bg-emerald-500",to: "bg-teal-600"    }, displayDuration: 5500 },
  { id: "game-5", colors: { from: "bg-rose-500",   to: "bg-pink-600"    }, displayDuration: 5000 },
];

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const EASE_IN: [number, number, number, number] = [0.55, 0, 1, 1];

const EASE_CSS: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const EASE_ACCEL: [number, number, number, number] = [0.4, 0, 1, 1];

const NOISE_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E";

const CARD_PEEK = 130;
const CARD_GAP  = 20;

const HOVER_BLEED = 16;

const DOT_H         = 12;
const CONTROL_H     = 52;
const ACTIVE_DOT_W  = 56;
const PILL_VERT_PX  = (CONTROL_H - DOT_H) / 2;
const PILL_HORIZ_PX = 18;
const BTN_GAP       = 14;

const CONTROLS_BOTTOM = 32;

const HOVER_EXIT_MS        = 320;
const TEXT_EXIT_MS         = HOVER_EXIT_MS + 150; 
const CARD_SETTLE_MS       = 650;
const TEXT_ENTER_S         = 0.48;
const TEXT_EXIT_S          = 0.20;
const INITIAL_TEXT_SHOW_MS = 720;

const TEXT_SLIDE_X = 20;

const CONTENT_Y_DEFAULT = 68;

const CARD_SPRING = {
  type:      "spring" as const,
  stiffness: 280,
  damping:   28,
  mass:      0.9,
};

const HOVER_UNLOCK_AFTER_SWAP_MS =
  CARD_SETTLE_MS +
  Math.round(TEXT_ENTER_S * 1000) +
  160;

const GLASS_STYLE: React.CSSProperties = {
  background:           "rgba(22, 22, 22, 0.68)",
  backdropFilter:       "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
};

const CARD_VARIANTS: Variants = {
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

const CARD_VARIANTS_REDUCED: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  hover:   { scale: 1.01, transition: { duration: 0.2 } },
};

const ORB_VARIANTS: Variants = {
  hidden:  { opacity: 0, scale: 0.6 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 1.8, delay, ease: [0.2, 0.8, 0.2, 1] },
  }),
};

const POINTER_QUERY = "(hover: hover) and (pointer: fine)";

function subscribePointer(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(POINTER_QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getPointerSnapshot(): boolean {
  return window.matchMedia(POINTER_QUERY).matches;
}

function getPointerServerSnapshot(): boolean {
  return false;
}

function useHasPointer(): boolean {
  return useSyncExternalStore(subscribePointer, getPointerSnapshot, getPointerServerSnapshot);
}

interface GamesProgressControlsProps {
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
}

function GamesProgressControls({
  currentIndex, totalCards, isPlaying,
  fillRef, isVisible, onGoTo, onTogglePlay,
  playLabel, pauseLabel, goToLabel, carouselLabel,
}: GamesProgressControlsProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const reduced  = useReducedMotion();

  const wrapperSpring = { type: "spring" as const, stiffness: 260, damping: 24, mass: 0.8 };
  const pillSpring    = { type: "spring" as const, stiffness: 320, damping: 28, mass: 0.7 };
  const btnSpring     = { type: "spring" as const, stiffness: 280, damping: 22, mass: 0.7 };

  return (
    <div
      ref={outerRef}
      style={{
        position:  "sticky",
        bottom:    CONTROLS_BOTTOM,
        left:      "50%",
        transform: "translateX(-50%)",
        zIndex:    50,
        
        width:     "max-content",
        margin:    "0 auto",
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
            style={{ gap: BTN_GAP, transformOrigin: "center bottom" }}
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
                zIndex:          10,
                display:         "flex",
                alignItems:      "center",
                borderRadius:    9999,
                paddingTop:      PILL_VERT_PX,
                paddingBottom:   PILL_VERT_PX,
                paddingLeft:     PILL_HORIZ_PX,
                paddingRight:    PILL_HORIZ_PX,
                gap:             8,
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
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${goToLabel} ${idx + 1}`}
                    onClick={() => onGoTo(idx)}
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
                        ? "rgba(130, 130, 130, 0.45)"
                        : "rgba(165, 165, 165, 0.50)",
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
                          background:   "rgba(218, 218, 218, 0.92)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>

            <motion.button
              initial={{ 
                opacity: 0, 
                scale: reduced ? 1 : 0.2, 
                x: reduced ? 0 : -(BTN_GAP + CONTROL_H),
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
                x:       reduced ? 0 : -(BTN_GAP + CONTROL_H),
                backdropFilter: "blur(0px)",
                transition: {
                  opacity: { duration: 0.22, ease: EASE_IN },
                  scale:   reduced ? { duration: 0 } : { duration: 0.28, ease: EASE_IN },
                  x:       reduced ? { duration: 0 } : { duration: 0.28, ease: EASE_IN },
                  backdropFilter: { duration: 0.22, ease: EASE_IN },
                },
              }}
              whileTap={{ scale: reduced ? 1 : 0.86, transition: { duration: 0.1 } }}
              onClick={onTogglePlay}
              aria-label={isPlaying ? pauseLabel : playLabel}
              className="flex-shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-[filter] duration-200 hover:brightness-125 active:brightness-75"
              style={{
                ...GLASS_STYLE,
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
                ? <Pause size={18} fill="rgba(215,215,215,0.95)" stroke="none" strokeWidth={0} />
                : <Play  size={18} fill="rgba(215,215,215,0.95)" stroke="none" strokeWidth={0} style={{ transform: "translateX(1px)" }} />
              }
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GamesSection() {
  const t          = useTranslations("Games");
  const reduced    = useReducedMotion();
  const hasPointer = useHasPointer();

  const sectionRef   = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentIndex,   setCurrentIndex  ] = useState(0);
  const [direction,      setDirection     ] = useState<1 | -1>(1);
  const [textVisible,    setTextVisible   ] = useState(false);
  const [hoveredIdx,     setHoveredIdx    ] = useState<number | null>(null);
  const [isPlaying,      setIsPlaying     ] = useState(true);
  const [started,        setStarted       ] = useState(false);
  const [isInView,          setIsInView         ] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [containerWidth,    setContainerWidth   ] = useState(0);
  const [isHoverLocked,       setIsHoverLocked      ] = useState(false);

  const rafRef          = useRef(0);
  const timerActiveRef  = useRef(false);
  const progressRef     = useRef(0);
  const currentIndexRef = useRef(0);
  const fillRef         = useRef<HTMLDivElement | null>(null);
  const advanceRef      = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textShowRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverUnlockRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hoveredIdxRef       = useRef<number | null>(null);

  useEffect(() => {
    hoveredIdxRef.current = hoveredIdx;
  }, [hoveredIdx]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setContainerWidth(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cardWidth = Math.max(0, containerWidth - 2 * CARD_PEEK);
  const trackX    = containerWidth > 0
    ? CARD_PEEK - currentIndex * (cardWidth + CARD_GAP)
    : 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);
        if (visible && !started) setStarted(true);

        if (visible) {
          setIsControlsVisible(true);
        } else {

          if (entry.boundingClientRect.top < 0) {
            setIsControlsVisible(true);
          } else {
            setIsControlsVisible(false);
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const id = setTimeout(() => setTextVisible(true), INITIAL_TEXT_SHOW_MS);
    return () => clearTimeout(id);
  }, [started]);

  const stopTimer = useCallback(() => {
    timerActiveRef.current = false;
    cancelAnimationFrame(rafRef.current);
  }, []);

  const doAdvance = useCallback(
    (nextIndex: number) => {
      clearTimeout(advanceRef.current);
      clearTimeout(textShowRef.current);
      clearTimeout(hoverUnlockRef.current);
      stopTimer();

      const resolvedDir: 1 | -1 = nextIndex > currentIndexRef.current ? 1 : -1;

      setDirection(resolvedDir);
      progressRef.current = 0;

      setIsHoverLocked(true);

      advanceRef.current = setTimeout(() => {
        setTextVisible(false);

        const swapDelay = TEXT_EXIT_MS - HOVER_EXIT_MS;
        const swapTimer = setTimeout(() => {
          setCurrentIndex(nextIndex);
          textShowRef.current = setTimeout(
            () => setTextVisible(true),
            CARD_SETTLE_MS,
          );

          hoverUnlockRef.current = setTimeout(
            () => setIsHoverLocked(false),
            HOVER_UNLOCK_AFTER_SWAP_MS,
          );
        }, swapDelay);

        advanceRef.current = swapTimer;
      }, HOVER_EXIT_MS);
    },
    [stopTimer],
  );

  const startProgressTimer = useCallback(() => {
    const t0          = performance.now();
    const dur         = GAMES[currentIndexRef.current].displayDuration;
    const p0          = progressRef.current;
    const remaining   = 1 - p0;
    const remainingMs = remaining * dur;

    if (remainingMs <= 0) {
      doAdvance((currentIndexRef.current + 1) % GAMES.length);
      return;
    }

    timerActiveRef.current = true;

    const tick = (now: number) => {
      if (!timerActiveRef.current) return;
      const elapsed = now - t0;
      const p = p0 + (elapsed / remainingMs) * remaining;

      if (p >= 1) {
        timerActiveRef.current = false;
        doAdvance((currentIndexRef.current + 1) % GAMES.length);
        return;
      }

      progressRef.current = p;
      if (fillRef.current) fillRef.current.style.width = `${p * 100}%`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [doAdvance]);

  useEffect(() => {
    if (!textVisible || !isPlaying || !isInView) { stopTimer(); return; }
    startProgressTimer();
    return () => stopTimer();
  }, [textVisible, isPlaying, isInView, startProgressTimer, stopTimer]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(advanceRef.current);
      clearTimeout(textShowRef.current);
      clearTimeout(hoverUnlockRef.current);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) stopTimer();
    setIsPlaying((prev) => !prev);
  }, [isPlaying, stopTimer]);

  const goToCard = useCallback(
    (index: number) => {
      if (index === currentIndexRef.current) return;
      doAdvance(index);
    },
    [doAdvance],
  );

  const enterX = direction === 1 ?  TEXT_SLIDE_X : -TEXT_SLIDE_X;
  const exitX  = direction === 1 ? -TEXT_SLIDE_X :  TEXT_SLIDE_X;

  const headingV = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
    : {
        hidden:  { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.78, ease: EASE_OUT } },
      };

  const cardV = reduced ? CARD_VARIANTS_REDUCED : CARD_VARIANTS;

  return (
    <section
      ref={sectionRef}
      id="games"
      aria-labelledby="games-section-title"
      className="relative w-full bg-background pt-16 sm:pt-20 md:pt-28 lg:pt-32"
      style={{
        paddingBottom: `${CONTROLS_BOTTOM * 2 + CONTROL_H + 32}px`,
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={headingV}
          className="mb-10 md:mb-14"
        >
          <h2
            id="games-section-title"
            className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground"
            style={{ textRendering: "geometricPrecision" }}
          >
            {t("section_title")}
          </h2>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.82, ease: EASE_OUT }}
      >
        <div
          className="w-full overflow-hidden"
          style={{ paddingTop: HOVER_BLEED, paddingBottom: HOVER_BLEED }}
        >
          <div
            ref={containerRef}
            className="w-full overflow-visible"
            style={{ marginTop: -HOVER_BLEED, marginBottom: -HOVER_BLEED }}
            role="region"
            aria-roledescription="carousel"
            aria-label={t("section_title")}
          >
            {containerWidth > 0 && (
              <motion.div
                animate={{ x: trackX }}
                transition={reduced ? { duration: 0.3, ease: EASE_OUT } : CARD_SPRING}
                style={{
                  display:       "flex",
                  gap:           CARD_GAP,
                  height:        "clamp(28rem, 72vh, 48rem)",
                  willChange:    "transform",
                  paddingTop:    HOVER_BLEED,
                  paddingBottom: HOVER_BLEED,
                }}
              >
                {GAMES.map((game, idx) => {
                  const isActive = idx === currentIndex;
                  const hasImage = !!game.image;

                  const isHoverActive =
                    isActive && hoveredIdx === idx && !isHoverLocked && hasPointer;

                  return (
                    <motion.div
                      key={game.id}
                      variants={cardV}
                      animate={isHoverActive ? "hover" : undefined}
                      onHoverStart={() => hasPointer && setHoveredIdx(idx)}
                      onHoverEnd={()   => hasPointer && setHoveredIdx(null)}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${idx + 1} / ${GAMES.length}`}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "project-card group relative flex flex-col justify-end overflow-clip",
                        "border border-white/5 bg-[#101010]",
                        "shadow-sm transition-shadow duration-500",
                        isHoverActive && "shadow-2xl",
                      )}
                      style={{
                        width:         cardWidth,
                        height:        "100%",
                        flexShrink:    0,
                        borderRadius:  "2rem",
                        willChange:    "transform, filter",
                        pointerEvents: isActive ? "auto" : "none",
                      }}
                    >
                      <div
                        className="absolute inset-0 z-0 overflow-clip transform-gpu"
                        style={{ transform: "translate3d(0,0,0)" }}
                      >
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          className="absolute inset-0 w-full h-full z-0"
                        >
                          <motion.div variants={ORB_VARIANTS} custom={0.1} className="absolute inset-0">
                            <div
                              className={cn(
                                "absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[140px] opacity-15",
                                "transform-gpu will-change-transform",
                                game.colors.from,
                              )}
                            />
                          </motion.div>

                          <motion.div variants={ORB_VARIANTS} custom={0.3} className="absolute inset-0">
                            <div
                              className={cn(
                                "absolute bottom-0 -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-15",
                                "transform-gpu will-change-transform",
                                game.colors.to,
                              )}
                            />
                          </motion.div>

                          {!hasImage && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5, duration: 1 }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                              <motion.div
                                animate={isHoverActive ? { scale: 0.85 } : { scale: 0.8 }}
                                transition={{ duration: 0.30, ease: EASE_CSS }}
                                className="opacity-[0.05]"
                              >
                                <ImageIcon size={200} strokeWidth={0.5} />
                              </motion.div>
                            </motion.div>
                          )}

                          <div
                            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                            style={{ backgroundImage: `url("${NOISE_SVG}")` }}
                          />
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/10 to-transparent pointer-events-none" />
                        </motion.div>

                        {hasImage && (
                          <motion.div
                            className="absolute inset-0 w-full h-full z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          >
                            <Image
                              src={game.image!}
                              alt={t(`items.${game.id}.title`)}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 80vw"
                            />
                            <div
                              className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none z-20"
                              style={{
                                backdropFilter:       "blur(24px)",
                                WebkitBackdropFilter: "blur(24px)",
                                maskImage:            "linear-gradient(to top, black 50%, transparent 100%)",
                                WebkitMaskImage:      "linear-gradient(to top, black 50%, transparent 100%)",
                              }}
                            />
                            <div className="absolute inset-x-0 bottom-0 h-[60%] bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-20 opacity-90" />
                          </motion.div>
                        )}
                      </div>

                      {(() => {
                        const isHoverActive = hasPointer && hoveredIdx === idx && !isHoverLocked;

                        return (
                          <motion.div
                            className="relative z-30 flex flex-col p-7 sm:p-10"
                            animate={{
                              
                              y: hasPointer && !isHoverActive ? CONTENT_Y_DEFAULT : 0,
                            }}
                          transition={{
                            
                            y: { duration: 0.30, ease: EASE_CSS },
                          }}
                        >
                          <AnimatePresence>
                            {isActive && textVisible && (
                              <motion.div
                                key={`text-${game.id}`}
                                initial={{ opacity: 0, x: reduced ? 0 : enterX }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{
                                  opacity: 0,
                                  x:       reduced ? 0 : exitX,
                                  transition: { duration: TEXT_EXIT_S, ease: EASE_IN },
                                }}
                                transition={{
                                  x:       { duration: TEXT_ENTER_S, ease: EASE_OUT },
                                  opacity: { duration: TEXT_ENTER_S * 0.7, ease: "easeOut" },
                                }}
                              >
                                <h3 className="mb-2 text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                                  {t(`items.${game.id}.title`)}
                                </h3>
                                <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed max-w-lg line-clamp-2 drop-shadow-md">
                                  {t(`items.${game.id}.description`)}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                          {hasPointer ? (
                            isActive && (
                                <motion.div
                                  key={`btns-ptr-${game.id}`}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={isHoverActive && textVisible
                                    ? { opacity: 1, y: 0 }
                                    : { opacity: 0, y: 8 }
                                  }
                                  exit={{ opacity: 0, y: 8, transition: { duration: TEXT_EXIT_S } }}
                                  transition={isHoverActive && textVisible
                                    ? { duration: 0.30, ease: EASE_CSS, delay: 0.04 }
                                    : { duration: 0.22, ease: EASE_ACCEL }
                                  }
                                  className="mt-3 flex flex-row flex-wrap items-center gap-2.5"
                                  style={{ pointerEvents: isHoverActive && textVisible ? "auto" : "none" }}
                                >
                                  <PrimaryButton
                                    href={`/games/${game.id}`}
                                    target="_self"
                                    rel={undefined}
                                    className="rounded-full px-6 py-3 text-sm font-medium focus-visible:ring-offset-[#101010]"
                                  >
                                    {t("view_game")}
                                  </PrimaryButton>
                                  <SecondaryButton
                                    href={`/games/${game.id}/play`}
                                    target="_self"
                                    rel={undefined}
                                    className="rounded-full px-6 py-3 text-sm font-medium focus-visible:ring-offset-[#101010]"
                                  >
                                    {t("play_now")}
                                  </SecondaryButton>
                                </motion.div>
                              )
                          ) : (
                            isActive && textVisible && (
                                <motion.div
                                key={`btns-touch-${game.id}`}
                                initial={{ opacity: 0, x: reduced ? 0 : enterX }}
                                animate={{
                                  opacity: 1,
                                  x:       0,
                                  transition: {
                                    delay:    0.18,
                                    duration: TEXT_ENTER_S,
                                    ease:     EASE_OUT,
                                  },
                                }}
                                exit={{
                                  opacity: 0,
                                  x:       reduced ? 0 : exitX,
                                  transition: { duration: TEXT_EXIT_S, ease: EASE_IN },
                                }}
                                className="mt-3 flex flex-row flex-wrap items-center gap-2.5"
                              >
                                <PrimaryButton
                                  href={`/games/${game.id}`}
                                  target="_self"
                                  rel={undefined}
                                  className="rounded-full px-6 py-3 text-sm font-medium focus-visible:ring-offset-[#101010]"
                                >
                                  {t("view_game")}
                                </PrimaryButton>
                                <SecondaryButton
                                  href={`/games/${game.id}/play`}
                                  target="_self"
                                  rel={undefined}
                                  className="rounded-full px-6 py-3 text-sm font-medium focus-visible:ring-offset-[#101010]"
                                >
                                  {t("play_now")}
                                </SecondaryButton>
                              </motion.div>
                            )
                          )}
                          </AnimatePresence>
                        </motion.div>
                      );
                      })()}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      <GamesProgressControls
        currentIndex={currentIndex}
        totalCards={GAMES.length}
        isPlaying={isPlaying}
        isVisible={isControlsVisible}
        fillRef={fillRef}
        onGoTo={goToCard}
        onTogglePlay={togglePlay}
        playLabel={t("progress.play")}
        pauseLabel={t("progress.pause")}
        goToLabel={t("progress.go_to")}
        carouselLabel={t("section_title")}
      />
    </section>
  );
}
