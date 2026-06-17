"use client";

import { useEffect, useRef, type RefObject } from "react";

import { useLiveRef } from "@/lib/hooks/useLiveRef";

/** Horizontal travel (px) needed to fire a navigation. */
const TRIGGER_THRESHOLD = 18;
/** A gap longer than this (ms) between events resets an incomplete gesture. */
const GESTURE_GAP_MS = 80;
/**
 * After the last wheel event of a gesture (including its momentum tail), wait
 * this long (ms) before unlocking. macOS trackpad momentum events arrive every
 * ~16 ms, so this keeps us locked through the whole tail.
 */
const UNLOCK_IDLE_MS = 40;
/**
 * While locked, an event in the OPPOSITE direction this large (px) is a genuine
 * new flick (the user swiping back) — not tail noise — so we unlock at once.
 * This is what makes rapid back-and-forth paging as responsive as the keyboard,
 * while a same-direction movement stays locked to exactly one card no matter how
 * its velocity wavers.
 */
const REVERSAL_MIN = 6;

interface UseCarouselWheelOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  itemCount: number;
  /** In-flight target index — lets rapid swipes chain from the pending destination. */
  pendingIndexRef: RefObject<number>;
  /** This hook's own gesture lock (not shared — the pan handler owns a separate one). */
  swipeLockedRef: RefObject<boolean>;
  onNavigate: (nextIndex: number) => void;
}

/**
 * Translates horizontal wheel / trackpad input into one-card-per-gesture
 * navigation.
 *
 * Fire on the first threshold crossing, then stay locked for the rest of that
 * gesture — including its macOS momentum tail — by rescheduling an idle timeout
 * on every event. The lock holds through *any* same-direction wobble, so one
 * continuous movement always pages exactly one card; it only breaks early,
 * mid-tail, on a direction reversal (the user swiping back). The next discrete
 * flick — after the idle gap or a reversal — pages the next card, so paging feels
 * one-at-a-time, like the arrow keys. A physical mouse wheel (line/page delta
 * modes) unlocks immediately. Vertical-dominant scrolls pass through untouched.
 *
 * The listener and its idle timer are installed **exactly once**: `onNavigate`
 * and `itemCount` are read through refs so a re-render (e.g. the flurry of hover
 * / animation state updates a swipe triggers) can never tear the effect down
 * mid-gesture and strand the lock — the bug that made the trackpad intermittently
 * "stop responding".
 */
export function useCarouselWheel({
  containerRef,
  itemCount,
  pendingIndexRef,
  swipeLockedRef,
  onNavigate,
}: UseCarouselWheelOptions): void {
  const accumulatorRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedDirRef = useRef(0);

  // Read through refs so the effect below depends only on stable refs and runs
  // once for the lifetime of the component.
  const onNavigateRef = useLiveRef(onNavigate);
  const itemCountRef = useLiveRef(itemCount);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resetGesture = () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
      swipeLockedRef.current = false;
      accumulatorRef.current = 0;
      lockedDirRef.current = 0;
    };

    const scheduleUnlock = () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = setTimeout(resetGesture, UNLOCK_IDLE_MS);
    };

    const handleWheel = (e: WheelEvent) => {
      let dX = e.deltaX;
      let dY = e.deltaY;

      if (e.shiftKey && dY !== 0) { dX = dY; dY = 0; }
      if (Math.abs(dY) > Math.abs(dX)) return;
      e.preventDefault();

      let delta = dX;
      if (e.deltaMode === 1) delta *= 40;
      else if (e.deltaMode === 2) delta *= 800;

      const now = Date.now();
      const dt  = now - lastWheelTimeRef.current;
      lastWheelTimeRef.current = now;

      const absDelta = Math.abs(delta);
      const dir = delta > 0 ? 1 : delta < 0 ? -1 : 0;

      // Long pause ⇒ the previous gesture is over; start fresh.
      if (dt > GESTURE_GAP_MS) resetGesture();

      if (swipeLockedRef.current) {
        if (e.deltaMode !== 0) {
          // Physical mouse: each notch is its own gesture — unlock immediately.
          resetGesture();
        } else {
          // Trackpad: stay locked through this gesture and its tail. Only a real
          // swipe in the opposite direction counts as a new gesture.
          const reversed =
            dir !== 0 && lockedDirRef.current !== 0 &&
            dir !== lockedDirRef.current && absDelta >= REVERSAL_MIN;

          if (reversed) {
            resetGesture();
          } else {
            scheduleUnlock();
            return; // swallow the tail / same-direction wobble
          }
        }
      }

      accumulatorRef.current += delta;

      if (Math.abs(accumulatorRef.current) > TRIGGER_THRESHOLD) {
        const direction = accumulatorRef.current > 0 ? 1 : -1;
        const nextIdx = pendingIndexRef.current + direction;
        if (nextIdx >= 0 && nextIdx < itemCountRef.current) {
          onNavigateRef.current(nextIdx);
        }
        swipeLockedRef.current = true;
        lockedDirRef.current = direction;
        accumulatorRef.current = 0;
        scheduleUnlock();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      resetGesture();
    };
  }, [containerRef, pendingIndexRef, swipeLockedRef, onNavigateRef, itemCountRef]);
}
