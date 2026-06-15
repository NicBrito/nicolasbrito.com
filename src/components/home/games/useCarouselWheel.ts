"use client";

import { useEffect, useRef, type RefObject } from "react";

interface UseCarouselWheelOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  itemCount: number;
  currentIndexRef: RefObject<number>;
  /** Shared with the drag/pan handler so a flick can't double-fire. */
  swipeLockedRef: RefObject<boolean>;
  onNavigate: (nextIndex: number) => void;
}

/**
 * Translates horizontal wheel / trackpad input into carousel navigation.
 *
 * Distinguishes a deliberate "swipe" (single high-velocity flick → one card)
 * from a "rapid hold" (sustained low-velocity scrub → continuous paging) via a
 * small kinetic state machine, and normalizes physical mouse wheels (line/page
 * delta modes) to pixels. Vertical-dominant scrolls pass straight through.
 */
export function useCarouselWheel({
  containerRef,
  itemCount,
  currentIndexRef,
  swipeLockedRef,
  onNavigate,
}: UseCarouselWheelOptions): void {
  const wheelAccumulatorRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const hasDeceleratedRef = useRef(false);
  const gestureTypeRef = useRef<"UNKNOWN" | "SWIPE" | "RAPID_HOLD">("UNKNOWN");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      let dX = e.deltaX;
      let dY = e.deltaY;

      // Many browsers/OS combinations do not automatically map shift+wheel to deltaX
      if (e.shiftKey && dY !== 0) {
        dX = dY;
        dY = 0;
      }

      // Allow vertical scroll to pass through
      if (Math.abs(dY) > Math.abs(dX)) return;
      e.preventDefault();

      // Normalize physical mouse wheels (DOM_DELTA_LINE = 1, DOM_DELTA_PAGE = 2) to pixels
      let delta = dX;
      if (e.deltaMode === 1) delta *= 40;
      else if (e.deltaMode === 2) delta *= 800;

      const now = Date.now();
      const dt = now - lastWheelTimeRef.current;
      lastWheelTimeRef.current = now;

      // Reset state on new gesture (pause > 150ms)
      if (dt > 150) {
        wheelAccumulatorRef.current = 0;
        swipeLockedRef.current = false;
        hasDeceleratedRef.current = false;
        gestureTypeRef.current = "UNKNOWN";
      }

      const absDelta = Math.abs(delta);

      // Detect rapid consecutive swipes: if velocity dipped and spiked again
      if (swipeLockedRef.current && gestureTypeRef.current === "SWIPE") {
        if (absDelta < 15 || e.deltaMode !== 0) {
          hasDeceleratedRef.current = true;
        } else if (hasDeceleratedRef.current && absDelta > 30) {
          swipeLockedRef.current = false;
          hasDeceleratedRef.current = false;
          wheelAccumulatorRef.current = 0;
        }
      }

      wheelAccumulatorRef.current += delta;

      // Determine gesture type kinetically
      if (gestureTypeRef.current === "UNKNOWN") {
        if (absDelta > 15) {
          gestureTypeRef.current = "SWIPE";
        } else if (Math.abs(wheelAccumulatorRef.current) > 20) {
          gestureTypeRef.current = "RAPID_HOLD";
        }
      }

      // If they suddenly flick during RAPID_HOLD, convert to SWIPE and lock
      if (gestureTypeRef.current === "RAPID_HOLD" && absDelta > 30) {
        gestureTypeRef.current = "SWIPE";
        swipeLockedRef.current = true;
      }

      // Execute navigation based on physical gesture type
      if (gestureTypeRef.current === "SWIPE") {
        if (!swipeLockedRef.current && Math.abs(wheelAccumulatorRef.current) > 30) {
          const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
          const nextIdx = currentIndexRef.current + direction;
          if (nextIdx >= 0 && nextIdx < itemCount) {
            onNavigate(nextIdx);
          }
          swipeLockedRef.current = true; // Lock for the rest of this gesture
        }
      }
      else if (gestureTypeRef.current === "RAPID_HOLD") {
        const RAPID_THRESHOLD = 35; // Pixels per card in scrub mode
        if (Math.abs(wheelAccumulatorRef.current) > RAPID_THRESHOLD) {
          const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
          const nextIdx = currentIndexRef.current + direction;
          if (nextIdx >= 0 && nextIdx < itemCount) {
            onNavigate(nextIdx);
          }
          wheelAccumulatorRef.current = 0; // Reset accumulator for continuous rapid scrubbing
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [containerRef, itemCount, currentIndexRef, swipeLockedRef, onNavigate]);
}
