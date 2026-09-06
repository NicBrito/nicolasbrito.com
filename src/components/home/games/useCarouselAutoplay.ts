"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

import { useLiveRef } from "@/lib/hooks/useLiveRef";

interface UseCarouselAutoplayOptions {
  /** Run the timer while true; pausing/leaving the viewport sets it false. */
  enabled: boolean;
  /** Stable per-card dwell times (ms), indexed by card. */
  durations: readonly number[];
  /**
   * Reactive index of the visible card. Changing it restarts the RAF from
   * `progressRef.current` (which `doAdvance` already resets to 0 on every
   * navigation), enabling auto-resume after a manual swipe without toggling
   * `isPlaying`.
   */
  currentIndex: number;
  /** Live index of the visible card — used imperatively inside the RAF tick. */
  currentIndexRef: RefObject<number>;
  /** Shared 0–1 progress, preserved across pause so playback resumes in place. */
  progressRef: RefObject<number>;
  /** The active dot's fill element, written imperatively to avoid re-renders. */
  fillRef: RefObject<HTMLDivElement | null>;
  /** Called with the next index when the current card's time elapses. */
  onComplete: (nextIndex: number) => void;
}

/**
 * Drives carousel autoplay with a single `requestAnimationFrame` loop that
 * advances `progressRef` from its current value to 1, painting the active
 * dot's fill width directly (no React state per frame). When progress reaches
 * 1 it reports the next index and stops; the caller re-arms it by toggling
 * `enabled` after the swap. Returns `stop` so an explicit navigation can halt
 * the loop synchronously before React re-renders.
 */
export function useCarouselAutoplay({
  enabled,
  durations,
  currentIndex,
  currentIndexRef,
  progressRef,
  fillRef,
  onComplete,
}: UseCarouselAutoplayOptions): { stop: () => void } {
  const rafRef        = useRef(0);
  const activeRef     = useRef(false);
  const onCompleteRef = useLiveRef(onComplete);

  const stop = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    const len         = durations.length;
    const t0          = performance.now();
    const p0          = progressRef.current;
    const remaining   = 1 - p0;
    const remainingMs = remaining * durations[currentIndexRef.current];

    const complete = () => {
      activeRef.current = false;
      onCompleteRef.current((currentIndexRef.current + 1) % len);
    };

    activeRef.current = true;

    // Progress was already full when this run armed (autoplay re-enabled right
    // on the boundary). Defer the completion by one frame instead of running
    // `onComplete`'s state cascade synchronously inside the effect body: that
    // keeps the swap off the render-critical path, and parking the handle in
    // `rafRef` lets `stop` cancel it on unmount or disable.
    if (remainingMs <= 0) {
      rafRef.current = requestAnimationFrame(() => {
        if (activeRef.current) complete();
      });
      return stop;
    }

    const tick = (now: number) => {
      if (!activeRef.current) return;
      const p = p0 + ((now - t0) / remainingMs) * remaining;

      if (p >= 1) {
        complete();
        return;
      }

      progressRef.current = p;
      const fill = fillRef.current;
      if (fill) fill.style.width = `${p * 100}%`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return stop;
  }, [enabled, currentIndex, durations, currentIndexRef, progressRef, fillRef, onCompleteRef, stop]);

  return { stop };
}
