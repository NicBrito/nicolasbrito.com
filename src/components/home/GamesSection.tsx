"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useLiveRef } from "@/lib/hooks/useLiveRef";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

// Run layout-synchronously on the client (so the first paint already has a
// measured width) while no-op'ing during SSR to avoid React's warning.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

import { GameCard } from "./games/GameCard";
import { GamesProgressControls } from "./games/GamesProgressControls";
import { useCarouselAutoplay } from "./games/useCarouselAutoplay";
import { useCarouselWheel } from "./games/useCarouselWheel";
import {
  CARD_GAP,
  CARD_PEEK_BREAKPOINT,
  CARD_PEEK_MAX_PX,
  CARD_PEEK_MOBILE_PX,
  CARD_PEEK_RATIO,
  CARD_SETTLE_MS,
  CARD_SPRING,
  CARD_VARIANTS,
  CARD_VARIANTS_REDUCED,
  CONTROL_H,
  EASE_OUT,
  FOCUS_DELAY_MS,
  GAME_DURATIONS,
  GAMES,
  HOVER_BLEED,
  HOVER_EXIT_MS,
  HOVER_UNLOCK_AFTER_SWAP_MS,
  INITIAL_TEXT_SHOW_MS,
  BTN_EXIT_STAGGER_S,
  MANUAL_HOVER_UNLOCK_MS,
  MANUAL_TEXT_EXIT_S,
  MAX_CARD_WIDTH,
  PAN_DISTANCE_PX,
  PAN_VELOCITY_PXS,
  POINTER_QUERY,
  SWIPE_LOCK_MS,
  TEXT_EXIT_MS,
  TEXT_EXIT_S,
  TEXT_SLIDE_X,
} from "./games/constants";

type PendingFocus = { idx: number; type: "primary" | "secondary" };

/**
 * Selected Games — an autoplaying, fully navigable carousel.
 *
 * This component owns the carousel's *logic* only: the active index and its
 * paging state machine (`doAdvance`), viewport/visibility observers, and the
 * pointer / touch / wheel / keyboard input that all funnel through a single
 * `pendingIndexRef`-aware advance. Presentation lives in `GameCard`; autoplay
 * in `useCarouselAutoplay`; wheel gestures in `useCarouselWheel`. All tunable
 * timings and thresholds live in `./games/constants`.
 */
export function GamesSection() {
  const t          = useTranslations("Games");
  const reduced    = useReducedMotion();
  const hasPointer = useMediaQuery(POINTER_QUERY);

  const sectionRef   = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentIndex,      setCurrentIndex     ] = useState(0);
  const [direction,         setDirection        ] = useState<1 | -1>(1);
  const [textVisible,       setTextVisible      ] = useState(false);
  const [hoveredIdx,        setHoveredIdx       ] = useState<number | null>(null);
  const [isPlaying,         setIsPlaying        ] = useState(true);
  const [started,           setStarted          ] = useState(false);
  const [isInView,          setIsInView         ] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [containerWidth,    setContainerWidth   ] = useState(0);
  const [isHoverLocked,     setIsHoverLocked    ] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  // Pointer is over the action buttons (not merely the card) — autoplay pauses
  // here so an action never slides away from under a click.
  const [buttonsHovered,    setButtonsHovered   ] = useState(false);
  // Whether the *next* exit should use the larger/longer manual values. Defaults
  // true (manual is the common move); only autoplay flips it false for its staged
  // exit. It must already hold the manual value on the last render a card is
  // present, because AnimatePresence freezes a child's exit prop at removal.
  const [immediateExit,     setImmediateExit    ] = useState(true);

  // 0–1 autoplay progress and the active dot's fill, both written imperatively.
  const progressRef    = useRef(0);
  const fillRef        = useRef<HTMLDivElement | null>(null);
  const textShowRef    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverUnlockRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Timers for the staged exit choreography (used only by autoplay advances).
  const textHideRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const swapRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // When a manual swap starts and the outgoing card had pointer hover active,
  // we keep track of its index so GameCard can hold the buttons at opacity:1,y:0
  // through the exit delay (instead of letting them retract mid-slide).
  const [exitingHoverIdx,  setExitingHoverIdx ] = useState<number | null>(null);
  const exitHoverClearRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The wheel hook owns this lock; the pan handler has its own below. They never
  // co-occur (trackpad/mouse = wheel, touch = pan), and keeping them separate
  // stops one handler's timer from flipping the other's lock.
  const swipeLockedRef = useRef(false);
  const panLockedRef   = useRef(false);
  const panUnlockRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // In-flight target index, so rapid consecutive inputs chain from the pending
  // destination rather than the index React has committed so far.
  const pendingIndexRef = useRef(0);

  const primaryBtnRefs   = useRef<(HTMLAnchorElement | null)[]>([]);
  const secondaryBtnRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const pendingFocusRef  = useRef<PendingFocus | null>(null);
  const isMouseDownRef   = useRef(false);

  // Latest reactive values mirrored for imperative reads (handlers, RAF loop).
  const currentIndexRef      = useLiveRef(currentIndex);
  const isKeyboardFocusedRef = useLiveRef(isKeyboardFocused);
  const hoveredIdxRef        = useLiveRef(hoveredIdx);
  const isHoverLockedRef     = useLiveRef(isHoverLocked);

  // Lets the autoplay loop reach the latest `doAdvance` without re-arming.
  const doAdvanceRef = useRef<(nextIndex: number, staged?: boolean) => void>(() => {});

  // Distinguish keyboard focus (pause + reveal actions) from a click landing on
  // a focusable element, which must NOT trigger keyboard mode.
  useEffect(() => {
    const down = () => { isMouseDownRef.current = true; };
    const up   = () => { isMouseDownRef.current = false; };
    document.addEventListener("mousedown",  down, { passive: true });
    document.addEventListener("mouseup",    up,   { passive: true });
    document.addEventListener("touchstart", down, { passive: true });
    document.addEventListener("touchend",   up,   { passive: true });
    return () => {
      document.removeEventListener("mousedown",  down);
      document.removeEventListener("mouseup",    up);
      document.removeEventListener("touchstart", down);
      document.removeEventListener("touchend",   up);
    };
  }, []);

  // Move keyboard focus onto the destination card's action the instant that card
  // becomes active — its button is already mounted (active cards always render
  // their actions) — rather than waiting for the card to settle. Otherwise the
  // outgoing card's button unmounts mid-entry, focus falls to <body>, and arrow
  // keys stop paging until things settle. `preventScroll` keeps the centered
  // card from nudging the viewport.
  useEffect(() => {
    const focus = pendingFocusRef.current;
    if (!focus) return;
    const refs = focus.type === "primary" ? primaryBtnRefs : secondaryBtnRefs;
    refs.current[focus.idx]?.focus({ preventScroll: true });
    pendingFocusRef.current = null;
  }, [currentIndex]);

  // Track the container width to size cards and centre the active one. Seed the
  // width synchronously (layout effect, before paint) from getBoundingClientRect
  // so the track renders measured on the first frame instead of flashing empty
  // for one frame while the ResizeObserver reports. The container has no padding
  // or border, so its border-box width equals the observer's contentRect width —
  // the seed and subsequent observations stay in agreement. The ResizeObserver
  // then keeps it current across resizes.
  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const initialWidth = el.getBoundingClientRect().width;
    if (initialWidth > 0) setContainerWidth(initialWidth);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getCardWidth = (width: number) => {
    if (width === 0) return 0;
    const peek =
      width >= CARD_PEEK_BREAKPOINT
        ? Math.min(width * CARD_PEEK_RATIO, CARD_PEEK_MAX_PX)
        : CARD_PEEK_MOBILE_PX;
    return Math.min(width - 2 * peek, MAX_CARD_WIDTH);
  };

  const cardWidth = getCardWidth(containerWidth);
  const trackX = containerWidth > 0
    ? (containerWidth - cardWidth) / 2 - currentIndex * (cardWidth + CARD_GAP)
    : 0;

  // Start the section and keep controls pinned once it has been scrolled past.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);
        if (visible && !started) setStarted(true);
        setIsControlsVisible(visible || entry.boundingClientRect.top < 0);
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

  // Autoplay completion: queue focus when keyboard-driven, then advance with the
  // staged choreography (the elegant, leisurely exit belongs to autoplay).
  const onAutoplayComplete = useCallback((nextIndex: number) => {
    if (isKeyboardFocusedRef.current) {
      pendingFocusRef.current = { idx: nextIndex, type: "primary" };
    }
    doAdvanceRef.current(nextIndex, true);
  }, [isKeyboardFocusedRef]);

  // Autoplay runs only while the section is on screen and uninterrupted. Per the
  // WAI-ARIA carousel pattern it pauses on keyboard focus (which flips isPlaying)
  // and on pointer hover — but specifically hover over the *actions*, not the
  // card, so that hovering the card still lets a slide auto-advance (and play its
  // staged hover-exit) while a button never slides away under a click. Progress
  // is preserved across pauses.
  const { stop: stopAutoplay } = useCarouselAutoplay({
    enabled: textVisible && isPlaying && isInView && !buttonsHovered,
    durations: GAME_DURATIONS,
    currentIndex,
    currentIndexRef,
    progressRef,
    fillRef,
    onComplete: onAutoplayComplete,
  });

  // The single entry point for every navigation.
  //
  // `staged` (autoplay) plays the leisurely exit: the outgoing card finishes
  // leaving before being replaced — hover lifts off (actions retract, content
  // lowers, card shrinks), the text slides out, and only then does the track
  // advance. A manual move (keyboard / wheel / touch / click) is *immediate*:
  // text and actions slide out together in the travel direction (actions trailing
  // a hair behind the text) while the next card slides in — so navigation stays
  // alive and snappy even mid-entry. `pendingIndexRef` updates synchronously so
  // bursts page one card each.
  const doAdvance = useCallback((nextIndex: number, staged = false) => {
    stopAutoplay();
    clearTimeout(textHideRef.current);
    clearTimeout(swapRef.current);
    clearTimeout(textShowRef.current);
    clearTimeout(hoverUnlockRef.current);

    setButtonsHovered(false);
    setImmediateExit(!staged);
    setDirection(nextIndex > pendingIndexRef.current ? 1 : -1);
    pendingIndexRef.current = nextIndex;
    progressRef.current = 0;
    setIsHoverLocked(true);

    // The swap itself, plus the after-swap text reveal and hover release.
    const commit = () => {
      swapRef.current = undefined;
      setCurrentIndex(nextIndex);
      setImmediateExit(true); // restore the manual default for the next move
      if (staged) {
        // Staged: text was already hidden; reveal it after the new card settles.
        textShowRef.current    = setTimeout(() => setTextVisible(true), CARD_SETTLE_MS);
        hoverUnlockRef.current = setTimeout(() => setIsHoverLocked(false), HOVER_UNLOCK_AFTER_SWAP_MS);
      } else {
        // Manual: text is already visible (incoming card shows it immediately).
        // Hover re-enables after the spring animation settles (~300ms).
        hoverUnlockRef.current = setTimeout(() => setIsHoverLocked(false), MANUAL_HOVER_UNLOCK_MS);
      }
    };

    if (staged) {
      textHideRef.current = setTimeout(() => setTextVisible(false), HOVER_EXIT_MS);
      swapRef.current     = setTimeout(commit, TEXT_EXIT_MS);
    } else {
      // Capture hover state BEFORE any state updates: if the outgoing card had
      // pointer hover active, its buttons were visible (opacity:1,y:0). We mark
      // it so GameCard can hold that state through the exit delay — otherwise
      // isHoverActive goes false in the same render, Framer captures the retract
      // animate target, and the buttons visibly slide down mid-transition.
      const exitingIdx     = currentIndexRef.current;
      const hoverWasActive =
        hoveredIdxRef.current === exitingIdx &&
        !isHoverLockedRef.current;
      clearTimeout(exitHoverClearRef.current);
      setExitingHoverIdx(hoverWasActive ? exitingIdx : null);
      if (hoverWasActive) {
        exitHoverClearRef.current = setTimeout(
          () => setExitingHoverIdx(null),
          Math.round((MANUAL_TEXT_EXIT_S + BTN_EXIT_STAGGER_S) * 1000) + 50,
        );
      }

      // Keep textVisible=true: the outgoing card's text rides off-screen with it
      // (exit is delayed until the spring settles), and the incoming card's text
      // enters immediately. No 650 ms blank period.
      setTextVisible(true);
      commit();
    }
  }, [stopAutoplay, currentIndexRef, hoveredIdxRef, isHoverLockedRef]);

  // Keep the autoplay loop pointed at the latest advance without re-arming it.
  useEffect(() => { doAdvanceRef.current = doAdvance; }, [doAdvance]);

  useCarouselWheel({
    containerRef,
    itemCount: GAMES.length,
    pendingIndexRef,
    swipeLockedRef,
    onNavigate: doAdvance,
  });

  useEffect(() => () => {
    clearTimeout(textHideRef.current);
    clearTimeout(swapRef.current);
    clearTimeout(textShowRef.current);
    clearTimeout(hoverUnlockRef.current);
    clearTimeout(panUnlockRef.current);
    clearTimeout(exitHoverClearRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    stopAutoplay();
    setIsPlaying((prev) => !prev);
  }, [stopAutoplay]);

  const goToCard = useCallback((index: number) => {
    if (index !== pendingIndexRef.current) doAdvance(index);
  }, [doAdvance]);

  const handleFocusPrimaryBtn = useCallback((idx?: number) => {
    const targetIdx = idx ?? currentIndexRef.current;
    if (targetIdx === currentIndexRef.current) {
      setTimeout(() => primaryBtnRefs.current[targetIdx]?.focus(), FOCUS_DELAY_MS);
    } else {
      pendingFocusRef.current = { idx: targetIdx, type: "primary" };
    }
  }, [currentIndexRef]);

  const handleAdvanceNextAndFocus = useCallback(() => {
    const pending = pendingIndexRef.current;
    if (pending < GAMES.length - 1) {
      pendingFocusRef.current = { idx: pending + 1, type: "primary" };
      doAdvance(pending + 1);
    }
  }, [doAdvance]);

  // Shared arrow-key paging for the action buttons; both chain from the pending
  // index so a burst of presses pages one card per press without freezing.
  const pageByArrows = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const pending = pendingIndexRef.current;
      if (pending < GAMES.length - 1) {
        pendingFocusRef.current = { idx: pending + 1, type: "primary" };
        doAdvance(pending + 1);
      }
      return true;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const pending = pendingIndexRef.current;
      if (pending > 0) {
        pendingFocusRef.current = { idx: pending - 1, type: "primary" };
        doAdvance(pending - 1);
      }
      return true;
    }
    if (e.key === " ") {
      e.preventDefault();
      togglePlay();
      return true;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      document.getElementById("game-dot-0")?.focus();
      return true;
    }
    return false;
  }, [doAdvance, togglePlay]);

  const handlePrimaryKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Tab" && e.shiftKey && idx > 0) {
      e.preventDefault();
      pendingFocusRef.current = { idx: idx - 1, type: "secondary" };
      doAdvance(idx - 1);
      return;
    }
    pageByArrows(e);
  }, [doAdvance, pageByArrows]);

  const handleSecondaryKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Tab" && !e.shiftKey && idx < GAMES.length - 1) {
      e.preventDefault();
      pendingFocusRef.current = { idx: idx + 1, type: "primary" };
      doAdvance(idx + 1);
      return;
    }
    pageByArrows(e);
  }, [doAdvance, pageByArrows]);

  const enterX = direction === 1 ? TEXT_SLIDE_X : -TEXT_SLIDE_X;
  // Both manual and staged exits slide in the carousel direction; manual is
  // faster. Buttons trail the text by BTN_EXIT_STAGGER_S on manual swaps only.
  const exitDuration  = immediateExit ? MANUAL_TEXT_EXIT_S : TEXT_EXIT_S;
  const btnsExitDelay = immediateExit ? BTN_EXIT_STAGGER_S : 0;
  const exitX         = direction === 1 ? -TEXT_SLIDE_X : TEXT_SLIDE_X;

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
        if (!isMouseDownRef.current && !isKeyboardFocused) {
          setIsKeyboardFocused(true);
          setIsPlaying(false);
        }
      }}
      onBlurCapture={(e) => {
        if (!sectionRef.current?.contains(e.relatedTarget as Node)) {
          setIsKeyboardFocused(false);
          setIsPlaying(true);
        }
      }}
      className="relative w-full bg-background pt-[clamp(4rem,8vw,8rem)]"
      style={{ paddingBottom: `calc(6rem + ${CONTROL_H})` }}
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
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {t("progress.status", { current: currentIndex + 1, total: GAMES.length })}
          </div>
          {containerWidth > 0 && (
            <motion.div
              initial={{ x: trackX }}
              animate={{ x: trackX }}
              transition={reduced ? { duration: 0.3, ease: EASE_OUT } : CARD_SPRING}
              onPanEnd={(_, info) => {
                if (panLockedRef.current) return;
                const dx = info.offset.x;
                const vx = info.velocity.x;
                const wantsNext = dx < -PAN_DISTANCE_PX || vx < -PAN_VELOCITY_PXS;
                const wantsPrev = dx >  PAN_DISTANCE_PX || vx >  PAN_VELOCITY_PXS;
                const pending = pendingIndexRef.current;
                const target =
                  wantsNext && pending < GAMES.length - 1 ? pending + 1 :
                  wantsPrev && pending > 0                 ? pending - 1 :
                  null;
                if (target === null) return;
                doAdvance(target);
                panLockedRef.current = true;
                clearTimeout(panUnlockRef.current);
                panUnlockRef.current = setTimeout(() => { panLockedRef.current = false; }, SWIPE_LOCK_MS);
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
                const isHoverActive =
                  !isHoverLocked &&
                  isActive &&
                  ((hasPointer && hoveredIdx === idx) || isKeyboardFocused);

                return (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={idx}
                    total={GAMES.length}
                    isActive={isActive}
                    isHoverActive={isHoverActive}
                    isExitingWithHover={exitingHoverIdx === idx}
                    started={started}
                    hasPointer={hasPointer}
                    reduced={!!reduced}
                    textVisible={textVisible}
                    enterX={enterX}
                    exitX={exitX}
                    exitDuration={exitDuration}
                    btnsExitDelay={btnsExitDelay}
                    cardWidth={cardWidth}
                    variants={cardV}
                    title={t(`items.${game.id}.title`)}
                    description={t(`items.${game.id}.description`)}
                    viewLabel={t("view_game")}
                    playLabel={t("play_now")}
                    onHoverStart={() => { if (hasPointer) setHoveredIdx(idx); }}
                    onHoverEnd={() => { if (hasPointer) setHoveredIdx(null); }}
                    onActivate={() => { if (!isActive && hasPointer) goToCard(idx); }}
                    onActionsHover={setButtonsHovered}
                    registerPrimary={(el) => { primaryBtnRefs.current[idx] = el as HTMLAnchorElement | null; }}
                    registerSecondary={(el) => { secondaryBtnRefs.current[idx] = el as HTMLAnchorElement | null; }}
                    onPrimaryKeyDown={(e) => handlePrimaryKeyDown(e, idx)}
                    onSecondaryKeyDown={(e) => handleSecondaryKeyDown(e, idx)}
                  />
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      <GamesProgressControls
        currentIndex={currentIndex}
        totalCards={GAMES.length}
        isPlaying={isPlaying && isInView && !buttonsHovered}
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
