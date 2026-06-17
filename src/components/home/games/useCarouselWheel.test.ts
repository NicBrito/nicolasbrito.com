import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCarouselWheel } from "./useCarouselWheel";

// Mirrors the hook's private idle-unlock window (ms). Kept local so the test
// fails loudly if that constant is retuned without revisiting these cases.
const IDLE_UNLOCK_MS = 40;

/** Mounts the hook against a detached div and returns its inputs + spies. */
function setup(pending = 0, itemCount = 5) {
  const el = document.createElement("div");
  const pendingIndexRef = { current: pending };
  const swipeLockedRef = { current: false };
  // The real onNavigate (doAdvance) commits the pending index synchronously,
  // which is what lets consecutive gestures chain. Mirror that here.
  const onNavigate = vi.fn((i: number) => {
    pendingIndexRef.current = i;
  });

  renderHook(() =>
    useCarouselWheel({
      containerRef: { current: el },
      itemCount,
      pendingIndexRef,
      swipeLockedRef,
      onNavigate,
    }),
  );

  return { el, pendingIndexRef, swipeLockedRef, onNavigate };
}

/** Dispatches a wheel event at an absolute fake-clock time (ms). */
function fireWheel(el: HTMLElement, init: WheelEventInit, atMs: number) {
  vi.setSystemTime(atMs);
  el.dispatchEvent(new WheelEvent("wheel", { cancelable: true, ...init }));
}

describe("useCarouselWheel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances exactly one card for a single horizontal gesture", () => {
    // Arrange
    const { el, onNavigate } = setup();

    // Act
    fireWheel(el, { deltaX: 30 }, 1000);

    // Assert
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("advances only once across a long continuous swipe (momentum tail swallowed)", () => {
    // Arrange
    const { el, onNavigate } = setup();

    // Act — one threshold-crossing event, then a long stream of tail events
    fireWheel(el, { deltaX: 20 }, 1000);
    for (let i = 1; i <= 20; i++) {
      fireWheel(el, { deltaX: 40 }, 1000 + i * 16);
    }

    // Assert
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("treats a gesture after a long gap as new and chains from the pending index", () => {
    // Arrange
    const { el, onNavigate } = setup();

    // Act — two flicks separated by more than the gesture-gap window
    fireWheel(el, { deltaX: 30 }, 1000);
    fireWheel(el, { deltaX: 30 }, 1200);

    // Assert
    expect(onNavigate).toHaveBeenCalledTimes(2);
    expect(onNavigate.mock.calls).toEqual([[1], [2]]);
  });

  it("releases the swipe lock after the idle window elapses", () => {
    // Arrange
    const { el, swipeLockedRef } = setup();

    // Act
    fireWheel(el, { deltaX: 30 }, 1000);
    const lockedDuringGesture = swipeLockedRef.current;
    vi.advanceTimersByTime(IDLE_UNLOCK_MS + 5);

    // Assert
    expect(lockedDuringGesture).toBe(true);
    expect(swipeLockedRef.current).toBe(false);
  });

  it("ignores vertical-dominant scrolling", () => {
    // Arrange
    const { el, onNavigate } = setup();

    // Act
    fireWheel(el, { deltaX: 5, deltaY: 50 }, 1000);

    // Assert
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("does not advance past the last card", () => {
    // Arrange
    const { el, onNavigate } = setup(4, 5);

    // Act
    fireWheel(el, { deltaX: 30 }, 1000);

    // Assert
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("does not advance before the first card", () => {
    // Arrange
    const { el, onNavigate } = setup(0, 5);

    // Act
    fireWheel(el, { deltaX: -30 }, 1000);

    // Assert
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("advances once per notch for a physical mouse wheel (line delta mode)", () => {
    // Arrange
    const { el, onNavigate } = setup();

    // Act — line-mode notches are self-contained gestures, even back-to-back
    fireWheel(el, { deltaX: 1, deltaMode: 1 }, 1000);
    fireWheel(el, { deltaX: 1, deltaMode: 1 }, 1010);

    // Assert
    expect(onNavigate).toHaveBeenCalledTimes(2);
    expect(onNavigate.mock.calls).toEqual([[1], [2]]);
  });

  it("reverses mid-tail without waiting — a back-swipe pages the other way at once", () => {
    // Arrange
    const { el, onNavigate } = setup(2, 5);

    // Act — swipe forward, then swipe back while the forward tail is still decaying
    fireWheel(el, { deltaX: 30 }, 1000); // → 3
    fireWheel(el, { deltaX: 10 }, 1016); // tail (swallowed)
    fireWheel(el, { deltaX: 6 }, 1032); // tail (swallowed)
    fireWheel(el, { deltaX: -30 }, 1048); // reversal → 2

    // Assert
    expect(onNavigate.mock.calls).toEqual([[3], [2]]);
  });

  it("stays one card through a same-direction movement that dips then climbs", () => {
    // Arrange
    const { el, onNavigate } = setup();

    // Act — one continuous movement whose velocity sags and surges (no reversal)
    fireWheel(el, { deltaX: 30 }, 1000); // → 1, locks
    fireWheel(el, { deltaX: 3 }, 1016); // velocity sags
    fireWheel(el, { deltaX: 40 }, 1032); // surges again — still the same gesture
    fireWheel(el, { deltaX: 30 }, 1048); // …and again

    // Assert — a single same-direction movement never pages more than one card
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(1);
  });
});
