"use client";

import { NOISE_SVG } from "@/lib/assets";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { GameCardActions } from "./games/GameCardActions";
import { GamesProgressControls } from "./games/GamesProgressControls";
import { useCarouselWheel } from "./games/useCarouselWheel";
import {
  CARD_GAP,
  CARD_SETTLE_MS,
  CARD_SPRING,
  CARD_VARIANTS,
  CARD_VARIANTS_REDUCED,
  CONTENT_Y_DEFAULT,
  CONTROL_H,
  EASE_ACCEL,
  EASE_CSS,
  EASE_IN,
  EASE_OUT,
  GAMES,
  HOVER_BLEED,
  HOVER_EXIT_MS,
  HOVER_UNLOCK_AFTER_SWAP_MS,
  INITIAL_TEXT_SHOW_MS,
  MAX_CARD_WIDTH,
  ORB_VARIANTS,
  POINTER_QUERY,
  TEXT_ENTER_S,
  TEXT_EXIT_MS,
  TEXT_EXIT_S,
  TEXT_SLIDE_X,
} from "./games/constants";

export function GamesSection() {
  const t          = useTranslations("Games");
  const reduced    = useReducedMotion();
  const hasPointer = useMediaQuery(POINTER_QUERY);

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
  const [isHoverLocked,     setIsHoverLocked    ] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  const rafRef          = useRef(0);
  const timerActiveRef  = useRef(false);
  const progressRef     = useRef(0);
  const currentIndexRef = useRef(0);
  const fillRef         = useRef<HTMLDivElement | null>(null);
  const advanceRef      = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textShowRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverUnlockRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const swipeLockedRef      = useRef(false);

  const primaryBtnRefs      = useRef<(HTMLAnchorElement | null)[]>([]);
  const secondaryBtnRefs    = useRef<(HTMLAnchorElement | null)[]>([]);

  const hoveredIdxRef       = useRef<number | null>(null);
  const pendingFocusRef     = useRef<{ idx: number; type: "primary" | "secondary" } | null>(null);
  const isMouseDownRef      = useRef(false);
  const isKeyboardFocusedRef = useRef(false);

  useEffect(() => {
    isKeyboardFocusedRef.current = isKeyboardFocused;
  }, [isKeyboardFocused]);

  useEffect(() => {
    const handleMouseDown = () => { isMouseDownRef.current = true; };
    const handleMouseUp = () => { isMouseDownRef.current = false; };
    // also handle touch
    const handleTouchStart = () => { isMouseDownRef.current = true; };
    const handleTouchEnd = () => { isMouseDownRef.current = false; };

    document.addEventListener("mousedown", handleMouseDown, { passive: true });
    document.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (textVisible && !isHoverLocked && pendingFocusRef.current !== null) {
      setTimeout(() => {
        const focusData = pendingFocusRef.current;
        if (!focusData) return;
        const { idx, type } = focusData;
        if (type === "primary") {
          primaryBtnRefs.current[idx]?.focus();
        } else {
          secondaryBtnRefs.current[idx]?.focus();
        }
        pendingFocusRef.current = null;
      }, 50);
    }
  }, [textVisible, isHoverLocked]);

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

  const getCardWidth = (width: number) => {
    if (width === 0) return 0;

    // Dynamic peek scaling from 24px on mobile up to 120px on desktop
    let dynamicPeek = 24;
    if (width >= 640) {
      dynamicPeek = Math.min(width * 0.08, 120);
    }

    let w = width - 2 * dynamicPeek;
    if (w > MAX_CARD_WIDTH) w = MAX_CARD_WIDTH;

    return w;
  };

  const cardWidth = getCardWidth(containerWidth);
  const trackX = containerWidth > 0
    ? (containerWidth - cardWidth) / 2 - currentIndex * (cardWidth + CARD_GAP)
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
      const nextIdx = (currentIndexRef.current + 1) % GAMES.length;
      if (isKeyboardFocusedRef.current) {
        pendingFocusRef.current = { idx: nextIdx, type: "primary" };
      }
      doAdvance(nextIdx);
      return;
    }

    timerActiveRef.current = true;

    const tick = (now: number) => {
      if (!timerActiveRef.current) return;
      const elapsed = now - t0;
      const p = p0 + (elapsed / remainingMs) * remaining;

      if (p >= 1) {
        timerActiveRef.current = false;
        const nextIdx = (currentIndexRef.current + 1) % GAMES.length;
        if (isKeyboardFocusedRef.current) {
          pendingFocusRef.current = { idx: nextIdx, type: "primary" };
        }
        doAdvance(nextIdx);
        return;
      }

      progressRef.current = p;
      if (fillRef.current) fillRef.current.style.width = `${p * 100}%`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [doAdvance]);

  useCarouselWheel({
    containerRef,
    itemCount: GAMES.length,
    currentIndexRef,
    swipeLockedRef,
    onNavigate: doAdvance,
  });

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

  const handleFocusPrimaryBtn = useCallback((idx?: number) => {
    const targetIdx = idx ?? currentIndexRef.current;
    if (targetIdx === currentIndexRef.current) {
      setTimeout(() => primaryBtnRefs.current[targetIdx]?.focus(), 50);
    } else {
      pendingFocusRef.current = { idx: targetIdx, type: "primary" };
    }
  }, []);

  const handleAdvanceNextAndFocus = useCallback(() => {
    if (currentIndexRef.current < GAMES.length - 1) {
      const nextIdx = currentIndexRef.current + 1;
      pendingFocusRef.current = { idx: nextIdx, type: "primary" };
      doAdvance(nextIdx);
    }
  }, [doAdvance]);

  const handlePrimaryKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Tab" && e.shiftKey) {
      if (idx > 0) {
        e.preventDefault();
        pendingFocusRef.current = { idx: idx - 1, type: "secondary" };
        doAdvance(idx - 1);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (idx < GAMES.length - 1) {
        pendingFocusRef.current = { idx: idx + 1, type: "primary" };
        doAdvance(idx + 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (idx > 0) {
        pendingFocusRef.current = { idx: idx - 1, type: "primary" };
        doAdvance(idx - 1);
      }
    } else if (e.key === " ") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      document.getElementById("game-dot-0")?.focus();
    }
  }, [doAdvance, togglePlay]);

  const handleSecondaryKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Tab" && !e.shiftKey) {
      if (idx < GAMES.length - 1) {
        e.preventDefault();
        pendingFocusRef.current = { idx: idx + 1, type: "primary" };
        doAdvance(idx + 1);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (idx < GAMES.length - 1) {
        pendingFocusRef.current = { idx: idx + 1, type: "primary" };
        doAdvance(idx + 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (idx > 0) {
        pendingFocusRef.current = { idx: idx - 1, type: "primary" };
        doAdvance(idx - 1);
      }
    } else if (e.key === " ") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      document.getElementById("game-dot-0")?.focus();
    }
  }, [doAdvance, togglePlay]);

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
      onFocusCapture={() => {
        if (!isMouseDownRef.current) {
          if (!isKeyboardFocused) {
            setIsKeyboardFocused(true);
            setIsPlaying(false);
          }
        }
      }}
      onBlurCapture={(e) => {
        if (!sectionRef.current?.contains(e.relatedTarget as Node)) {
          setIsKeyboardFocused(false);
          setIsPlaying(true);
        }
      }}
      className="relative w-full bg-background pt-[clamp(4rem,8vw,8rem)]"
      style={{
        paddingBottom: `calc(6rem + ${CONTROL_H})`,
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-[clamp(1rem,3vw,2rem)]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={headingV}
          className="mb-8 md:mb-14"
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
                onPanEnd={(e, info) => {
                  if (swipeLockedRef.current) return;
                  const swipe = info.offset.x;
                  if (swipe < -40 && currentIndexRef.current < GAMES.length - 1) {
                    doAdvance(currentIndexRef.current + 1);
                    swipeLockedRef.current = true;
                    setTimeout(() => { swipeLockedRef.current = false; }, 650);
                  } else if (swipe > 40 && currentIndexRef.current > 0) {
                    doAdvance(currentIndexRef.current - 1);
                    swipeLockedRef.current = true;
                    setTimeout(() => { swipeLockedRef.current = false; }, 650);
                  }
                }}
                style={{
                  display:       "flex",
                  gap:           CARD_GAP,
                  height:        "clamp(24rem, 65vh, 48rem)",
                  willChange:    "transform",
                  paddingTop:    HOVER_BLEED,
                  paddingBottom: HOVER_BLEED,
                  touchAction:   "pan-y",
                }}
              >
                {GAMES.map((game, idx) => {
                  const isActive = idx === currentIndex;
                  const hasImage = !!game.image;

                  const isHoverActive =
                    !isHoverLocked && isActive && ((hasPointer && hoveredIdx === idx) || isKeyboardFocused);

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
                      onClick={() => {
                        if (!isActive && hasPointer) goToCard(idx);
                      }}
                      className={cn(
                        "project-card group relative flex flex-col justify-end overflow-clip",
                        "border border-white/5 bg-card",
                        "shadow-sm transition-shadow duration-500",
                        isHoverActive && "shadow-2xl",
                      )}
                      style={{
                        width:         cardWidth,
                        height:        "100%",
                        flexShrink:    0,
                        borderRadius:  "2rem",
                        willChange:    "transform, filter",
                        pointerEvents: hasPointer ? "auto" : (isActive ? "auto" : "none"),
                        cursor:        !isActive && hasPointer ? "pointer" : "default",
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

                      <motion.div
                        className="relative z-30 flex flex-col p-8 md:p-12"
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
                              <h3 className="mb-2 sm:mb-3 text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg leading-tight">
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
                                className="mt-[clamp(0.75rem,2vw,1.25rem)] flex flex-row flex-wrap items-center gap-[clamp(0.5rem,1.5vw,0.75rem)]"
                                style={{ pointerEvents: isHoverActive && textVisible ? "auto" : "none" }}
                              >
                                <GameCardActions
                                  gameId={game.id}
                                  isActive={isActive}
                                  viewLabel={t("view_game")}
                                  playLabel={t("play_now")}
                                  registerPrimary={(el) => { primaryBtnRefs.current[idx] = el as HTMLAnchorElement | null; }}
                                  registerSecondary={(el) => { secondaryBtnRefs.current[idx] = el as HTMLAnchorElement | null; }}
                                  onPrimaryKeyDown={(e) => handlePrimaryKeyDown(e, idx)}
                                  onSecondaryKeyDown={(e) => handleSecondaryKeyDown(e, idx)}
                                />
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
                                className="mt-[clamp(0.75rem,2vw,1.25rem)] flex flex-row flex-wrap items-center gap-[clamp(0.5rem,1.5vw,0.75rem)]"
                              >
                                <GameCardActions
                                  gameId={game.id}
                                  isActive={isActive}
                                  viewLabel={t("view_game")}
                                  playLabel={t("play_now")}
                                  registerPrimary={(el) => { primaryBtnRefs.current[idx] = el as HTMLAnchorElement | null; }}
                                  registerSecondary={(el) => { secondaryBtnRefs.current[idx] = el as HTMLAnchorElement | null; }}
                                  onPrimaryKeyDown={(e) => handlePrimaryKeyDown(e, idx)}
                                  onSecondaryKeyDown={(e) => handleSecondaryKeyDown(e, idx)}
                                />
                              </motion.div>
                            )
                          )}
                        </AnimatePresence>
                      </motion.div>
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
        onFocusPrimaryBtn={handleFocusPrimaryBtn}
        onAdvanceNext={handleAdvanceNextAndFocus}
      />
    </section>
  );
}
