import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCarouselAutoplay } from "./useCarouselAutoplay";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal scaffold that wires up all the ref arguments the hook expects.
 * Callers may override specific fields via the `overrides` spread.
 */
function setup(overrides: {
  enabled?: boolean;
  durations?: readonly number[];
  currentIndex?: number;
  progressStart?: number;
  fillEl?: HTMLDivElement | null;
} = {}) {
  const {
    enabled = true,
    durations = [3000, 3000, 3000],
    currentIndex = 0,
    progressStart = 0,
    fillEl = null,
  } = overrides;

  const currentIndexRef = { current: currentIndex };
  const progressRef = { current: progressStart };
  const fillRef = { current: fillEl };
  const onComplete = vi.fn();

  const { result, rerender } = renderHook(
    (props: Parameters<typeof useCarouselAutoplay>[0]) =>
      useCarouselAutoplay(props),
    {
      initialProps: {
        enabled,
        durations,
        currentIndex,
        currentIndexRef,
        progressRef,
        fillRef,
        onComplete,
      },
    },
  );

  return { result, rerender, currentIndexRef, progressRef, fillRef, onComplete };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCarouselAutoplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Stub RAF / cAF so we control every frame imperatively.
    let rafId = 0;
    const pending = new Map<number, FrameRequestCallback>();
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        const id = ++rafId;
        pending.set(id, cb);
        return id;
      },
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      (id: number) => {
        pending.delete(id);
      },
    );
    // Expose the pending map for tick helpers below.
    (globalThis as Record<string, unknown>).__rafPending = pending;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (globalThis as Record<string, unknown>).__rafPending;
  });

  /** Fires all currently-queued RAF callbacks with the given timestamp. */
  function drainRAF(atMs: number) {
    const pending = (globalThis as Record<string, unknown>).__rafPending as Map<
      number,
      FrameRequestCallback
    >;
    const entries = [...pending.entries()];
    for (const [id, cb] of entries) {
      pending.delete(id);
      cb(atMs);
    }
  }

  // -------------------------------------------------------------------------
  // Branch 1 — disabled/stopped: no RAF scheduled, onComplete never called
  // -------------------------------------------------------------------------
  it("does not schedule RAF or call onComplete when enabled is false", () => {
    // Arrange
    setup({ enabled: false });

    const pending = (globalThis as Record<string, unknown>).__rafPending as Map<
      number,
      FrameRequestCallback
    >;

    // Act — nothing; the effect ran during renderHook with enabled=false.

    // Assert
    expect(pending.size).toBe(0);
  });

  it("tears down the RAF loop when enabled transitions from true to false", () => {
    // Arrange
    const { rerender, onComplete } = setup({ enabled: true, durations: [3000] });

    const pending = (globalThis as Record<string, unknown>).__rafPending as Map<
      number,
      FrameRequestCallback
    >;

    // Confirm the loop started.
    expect(pending.size).toBe(1);

    // Act — disable autoplay (mirrors pausing the carousel)
    rerender({
      enabled: false,
      durations: [3000],
      currentIndex: 0,
      currentIndexRef: { current: 0 },
      progressRef: { current: 0 },
      fillRef: { current: null },
      onComplete,
    });

    // Assert — pending RAF is gone and onComplete was never invoked
    expect(pending.size).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Branch 2 — early-complete guard: progressRef already at 1 (remainingMs ≤ 0).
  // The completion is deferred by one RAF so onComplete's state cascade never
  // runs inline in the effect body, and the deferred frame is cancellable.
  // -------------------------------------------------------------------------
  it("defers onComplete to a RAF frame, cancels it on disable, and re-arms it, when progress is already complete", () => {
    // Arrange — progress already at 1.0 means remainingMs === 0
    const durations = [3000, 3000, 3000];
    const { rerender, currentIndexRef, progressRef, fillRef, onComplete } = setup({
      enabled: true,
      durations,
      currentIndex: 0,
      progressStart: 1,
    });

    const pending = (globalThis as Record<string, unknown>).__rafPending as Map<
      number,
      FrameRequestCallback
    >;

    // Assert — the effect scheduled a frame instead of completing inline
    expect(pending.size).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();

    // Act — disable autoplay before that frame runs, then drain (timestamp is
    // irrelevant here: the deferred callback ignores it).
    rerender({
      enabled: false,
      durations,
      currentIndex: 0,
      currentIndexRef,
      progressRef,
      fillRef,
      onComplete,
    });
    drainRAF(0);

    // Assert — teardown cancelled the deferred completion
    expect(pending.size).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();

    // Act — re-enable: progress is still 1, so the deferral arms again
    rerender({
      enabled: true,
      durations,
      currentIndex: 0,
      currentIndexRef,
      progressRef,
      fillRef,
      onComplete,
    });

    // Assert — a fresh frame is pending, still nothing fired inline
    expect(pending.size).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();

    // Act — let that frame run
    drainRAF(0);

    // Assert — completion fired once on the frame, wraps to index 1, loop stopped
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(1);
    expect(pending.size).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Branch 3 — normal tick: progress advances but does NOT yet reach 1
  // -------------------------------------------------------------------------
  it("advances progressRef and updates fill width on a partial tick without completing", () => {
    // Arrange
    const fillEl = document.createElement("div");
    const { progressRef, fillRef } = setup({
      enabled: true,
      durations: [4000],
      currentIndex: 0,
      progressStart: 0,
      fillEl,
    });

    // Confirm fill element wired up.
    expect(fillRef.current).toBe(fillEl);

    const pending = (globalThis as Record<string, unknown>).__rafPending as Map<
      number,
      FrameRequestCallback
    >;

    // Assert a RAF was queued after the effect.
    expect(pending.size).toBe(1);

    // Act — fire one tick at t=1000 ms (25% of 4000 ms dwell)
    // t0 captured by the hook is performance.now() at effect time (0 ms in fake env).
    // elapsed = 1000, remainingMs = 4000, so p = 0 + (1000/4000)*1 = 0.25
    drainRAF(1000);

    // Assert — progress moved forward but is below 1
    expect(progressRef.current).toBeCloseTo(0.25, 5);
    expect(fillEl.style.width).toBe("25%");
    // A subsequent RAF should have been requested (loop continues)
    expect(pending.size).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Branch 4 — completion + wrap: last card completes → wraps to index 0
  // -------------------------------------------------------------------------
  it("calls onComplete with wrapped index when progress reaches 1 on the last card", () => {
    // Arrange — start at last card (index 2 of 3)
    const { onComplete } = setup({
      enabled: true,
      durations: [3000, 3000, 3000],
      currentIndex: 2,
      progressStart: 0,
    });

    const pending = (globalThis as Record<string, unknown>).__rafPending as Map<
      number,
      FrameRequestCallback
    >;

    expect(pending.size).toBe(1);

    // Act — fire a tick at exactly 3000 ms (p = 1.0 → completion triggered)
    drainRAF(3000);

    // Assert — RAF loop stopped, onComplete called with 0 (wraps from last → first)
    expect(pending.size).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(0);
  });

  it("advances index without wrapping when completing from a non-last card", () => {
    // Arrange — start at card 0 of 3
    const { onComplete } = setup({
      enabled: true,
      durations: [2000, 2000, 2000],
      currentIndex: 0,
      progressStart: 0,
    });

    const pending = (globalThis as Record<string, unknown>).__rafPending as Map<
      number,
      FrameRequestCallback
    >;

    expect(pending.size).toBe(1);

    // Act — advance time fully past the 2000 ms dwell
    drainRAF(2000);

    // Assert — moves to card 1
    expect(onComplete).toHaveBeenCalledWith(1);
    expect(pending.size).toBe(0);
  });
});
