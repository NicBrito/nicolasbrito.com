import { act, render, waitFor } from "@testing-library/react";
import { hasReducedMotionListener, prefersReducedMotion } from "motion-dom";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/en.json";
import { ScrollProgress } from "./ScrollProgress";

// ---------------------------------------------------------------------------
// Wave-4 pre-refactor regression net. This pins ScrollProgress's CURRENT
// behavior (warts included, per DP-8/DP-12 audit context) so the eventual
// refactor has a safety net. Real framer-motion is used throughout (no
// `vi.mock("framer-motion", ...)`) — same "exercise it for real" philosophy
// as the sibling HamburgerMenu.test.tsx.
//
// Three non-obvious environment facts drive every helper below (all
// empirically confirmed against this repo's exact jsdom/framer-motion/
// motion-dom versions before writing any assertion):
//
// 1. jsdom has no `document.scrollingElement` (it is `undefined`, not
//    `document.documentElement`). framer-motion's useScroll() defaults its
//    tracked container to `document.scrollingElement` and silently no-ops
//    (see framer-motion/dist/es/render/dom/scroll/track.mjs: `if (!container)
//    return noop`) when that is falsy. Every test that needs scroll-driven
//    behavior therefore shims it to `document.documentElement`, matching a
//    real standards-mode document.
// 2. framer-motion's internal frame scheduler
//    (motion-dom/dist/es/frameloop/frame.mjs) captures `requestAnimationFrame`
//    at MODULE-EVALUATION time — before any test's `vi.useFakeTimers()` can
//    possibly run (import hoisting evaluates it first). jsdom's own rAF is a
//    real `setInterval`-backed polyfill. Empirically confirmed: with fake
//    timers active, dispatching "scroll" + advancing fake time never invokes
//    a single scrollY listener. So the scroll pipeline (and anything
//    downstream of it — isScrolling, the bounce/idle timeouts, the y
//    transform) can only be driven with REAL timers/real rAF frames, never
//    `vi.useFakeTimers()`. This also answers the "use fake timers" guidance
//    for the inactivity hide in VISIBILITY GATE below: there is nothing to
//    fake-advance, because the 500ms idle timeout is only ever armed from
//    inside that same real-rAF-driven handler.
// 3. `useReducedMotion()` lazily initializes a MODULE-LEVEL singleton
//    (motion-dom's `hasReducedMotionListener`/`prefersReducedMotion`) the
//    FIRST time it is ever called anywhere in this file, then never again —
//    later mounts just reuse the cached value. Resetting both refs in
//    `beforeEach` (motion-dom re-exports them, and there is exactly one
//    resolved copy of the package — confirmed via `npm ls`-equivalent
//    inspection) forces every test's first render to re-consult ITS OWN
//    matchMedia mock, so reduced-motion behavior is order-independent
//    instead of "whichever test happens to run first wins".
// ---------------------------------------------------------------------------

interface MockMediaQueryList {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

/**
 * Query-aware matchMedia mock. ScrollProgress consults TWO independent
 * queries: its own POINTER_MEDIA_QUERY ("(any-pointer: fine)") via
 * useMediaQuery, and — transitively, through useReducedMotion() —
 * "(prefers-reduced-motion)" (no ": reduce" suffix; that exact string is
 * framer-motion's own query, per motion-dom's initPrefersReducedMotion()).
 * A single shared MQL (as in useMediaQuery.test.ts, which only ever probes
 * one query) would conflate the two, so this keys a small registry by query
 * string instead. Unlisted queries default to non-matching.
 */
function installMatchMedia(overrides: Record<string, boolean> = {}) {
  const registry = new Map<string, MockMediaQueryList>();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string): MockMediaQueryList => {
      let mql = registry.get(query);
      if (!mql) {
        mql = {
          matches: overrides[query] ?? false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
        registry.set(query, mql);
      }
      return mql;
    }),
  });
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  constructor(public readonly callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  constructor(public readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }
}

/** Overrides the (otherwise read-only/zeroed) layout metrics ScrollProgress reads. */
function setViewport({ scrollHeight, innerHeight }: { scrollHeight: number; innerHeight: number }) {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  window.innerHeight = innerHeight;
}

const SECTION_IDS = ["home", "projects", "games", "blog"] as const;

function renderScrollProgress() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {SECTION_IDS.map((id) => (
        <div key={id} id={id} />
      ))}
      <ScrollProgress />
    </NextIntlClientProvider>,
  );
}

/** Selects ScrollProgress's own floating indicator (see CONTAINER_CLASS in source). */
function getIndicator(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[class*="will-change-transform"]');
}

/**
 * Simulates a real browser scroll and pumps REAL animation frames so
 * framer-motion's useScroll() pipeline (window "scroll" listener -> frame
 * read/measure -> frame preUpdate/notify -> scrollY.set) actually runs. See
 * the file-level comment for why this must never run under fake timers.
 */
async function scrollTo(scrollTop: number) {
  document.documentElement.scrollTop = scrollTop;
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
  await act(async () => {
    // Sequential real rAF pumps (framer-motion's frame scheduler cannot be
    // faked — see the file-level comment), not parallelized: each pump must
    // observe the DOM/motion-value state left by the previous one.
    for (let i = 0; i < 3; i += 1) {
      await new Promise<number>((resolve) => requestAnimationFrame(resolve));
    }
  });
}

describe("ScrollProgress", () => {
  beforeEach(() => {
    hasReducedMotionListener.current = false;
    prefersReducedMotion.current = null;

    Object.defineProperty(document, "scrollingElement", {
      value: document.documentElement,
      configurable: true,
    });

    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    MockResizeObserver.instances = [];
    MockIntersectionObserver.instances = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.documentElement.scrollTop = 0;
    Reflect.deleteProperty(document, "scrollingElement");
  });

  // ---------------------------------------------------------------------
  // 1. RENDER SAFETY
  // ---------------------------------------------------------------------
  describe("render safety", () => {
    it("mounts without crashing, stays hidden until a scroll occurs, then exposes its (role-less) structure, and unmounts cleanly", async () => {
      // Arrange
      setViewport({ scrollHeight: 3000, innerHeight: 800 });
      installMatchMedia({ "(any-pointer: fine)": true });

      // Act — mount
      const { container, unmount } = renderScrollProgress();

      // Assert — isScrolling starts false, so AnimatePresence has no
      // children yet; mounting did not throw and shows nothing prematurely.
      expect(getIndicator(container)).not.toBeInTheDocument();

      // Act — first scroll brings the indicator into existence
      await scrollTo(500);

      // Assert — structure "as implemented": a bare positioned <div> with
      // no nav/aside/list role at all (docs/Foundation.md §4 describes a
      // "thread" of "segmented lines" on the left; the actual markup is a
      // single floating label on the right — see RISKS in the handback).
      const indicator = getIndicator(container);
      expect(indicator).toBeInTheDocument();
      expect(indicator?.tagName).toBe("DIV");
      expect(indicator).not.toHaveAttribute("role");
      expect(indicator?.textContent).toBe("Home");

      // Act / Assert — unmounts without crashing
      expect(() => unmount()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------
  // 2. PROGRESS SEMANTICS
  // ---------------------------------------------------------------------
  describe("progress semantics", () => {
    it("moves the indicator's y transform when the scroll position changes (semantics, not pixels)", async () => {
      // Arrange
      setViewport({ scrollHeight: 3000, innerHeight: 800 });
      installMatchMedia({ "(any-pointer: fine)": true });
      const { container } = renderScrollProgress();

      // Act — scroll near the top
      await scrollTo(200);
      const indicator = getIndicator(container);
      expect(indicator).toBeInTheDocument();
      const transformNearTop = indicator?.style.transform;
      expect(transformNearTop).toBeTruthy();

      // Act — scroll much further down
      await scrollTo(1800);

      // Assert — the only "progress representation" this implementation
      // exposes is the y-driven transform (a scrollbar-thumb-style
      // position — there is no aria progressbar and no literal thread
      // segments in the current markup). Pin that it tracks scroll
      // position, not an exact pixel value.
      await waitFor(() => {
        expect(getIndicator(container)?.style.transform).not.toBe(transformNearTop);
      });
    });
  });

  // ---------------------------------------------------------------------
  // 3. REDUCED MOTION
  // ---------------------------------------------------------------------
  describe("reduced motion", () => {
    it("still renders and functionally updates the active-section label when prefers-reduced-motion is on", async () => {
      // Arrange — matches=true for framer-motion's own reduced-motion
      // query; combined with the beforeEach reset, this makes THIS test's
      // mount re-run initPrefersReducedMotion() against it (see file-level
      // comment #3).
      installMatchMedia({
        "(any-pointer: fine)": true,
        "(prefers-reduced-motion)": true,
      });
      setViewport({ scrollHeight: 3000, innerHeight: 800 });
      const { container } = renderScrollProgress();

      // Act — scroll to bring the indicator into its visible state
      await scrollTo(500);

      // Assert — functional rendering: present, showing the default section.
      // We deliberately do not inspect framer-motion's animation targets
      // (BASE_MOTION vs BASE_MOTION_REDUCED) — only that reduced motion
      // does not block rendering.
      expect(getIndicator(container)?.textContent).toBe("Home");

      // Act — drive an active-section change the same way the real
      // IntersectionObserver would (entry.isIntersecting + entry.target.id).
      const sectionObserver = MockIntersectionObserver.instances.at(-1);
      expect(sectionObserver).toBeDefined();
      const projectsSection = document.getElementById("projects");
      expect(projectsSection).not.toBeNull();
      act(() => {
        sectionObserver?.callback(
          [
            {
              isIntersecting: true,
              target: projectsSection,
            } as unknown as IntersectionObserverEntry,
          ],
          sectionObserver as unknown as IntersectionObserver,
        );
      });

      // Assert — "and updates": the label morphs to the new section under
      // reduced motion too (MorphingLabel's own per-character transition is
      // not gated by prefers-reduced-motion at all — see RISKS).
      await waitFor(() => {
        expect(getIndicator(container)?.textContent).toBe("Projects");
      });
    });
  });

  // ---------------------------------------------------------------------
  // 4. CLEANUP PAIRS (the DP-8/DP-12 pre-refactor net)
  // ---------------------------------------------------------------------
  describe("cleanup pairs", () => {
    it("removes every window listener it added and disconnects every observer on unmount", () => {
      // Arrange
      setViewport({ scrollHeight: 3000, innerHeight: 800 });
      installMatchMedia({ "(any-pointer: fine)": true });
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const documentAddSpy = vi.spyOn(document, "addEventListener");
      const documentRemoveSpy = vi.spyOn(document, "removeEventListener");

      // Act — mount only. Deliberately never scrolls: doing so would flip
      // isScrolling and mount the motion.div/MorphingLabel spans, which use
      // `layout="position"` — that lazily boots a SEPARATE, singleton
      // "document projection node" system
      // (motion-dom/dist/es/projection/node/DocumentProjectionNode.mjs)
      // that attaches its OWN permanent window "resize" listener the first
      // time ANY layout-projecting element ever mounts in this file, and
      // never tears it down on this component's unmount (confirmed by
      // tracing every addEventListener call site). That is framer-motion's
      // internal, file-lifetime concern — not DP-8/DP-12 — so staying
      // scrolling-free here keeps this net scoped to ScrollProgress's own
      // effects (the dimensions effect + the scroll-tracking registration,
      // both of which run unconditionally on mount).
      const { unmount } = renderScrollProgress();

      const addedTypes = addSpy.mock.calls.map(([type]) => type as string);

      // Assert — component's own explicit listeners (the dimensions
      // effect's "resize"/"load") plus framer-motion's useScroll()
      // registration for the shimmed scrollingElement container
      // ("resize" + "scroll", added once for that container): exactly
      // "resize" x2, "scroll" x1, "load" x1.
      expect(addedTypes.slice().sort()).toEqual(["load", "resize", "resize", "scroll"]);

      // Act — unmount
      unmount();

      // Assert — every added type has an equal-count matching removal.
      const removedTypes = removeSpy.mock.calls.map(([type]) => type as string);
      expect(removedTypes.slice().sort()).toEqual(addedTypes.slice().sort());

      // Assert — document-level: ScrollProgress and its hooks (useMediaQuery,
      // useReducedMotion) only ever subscribe on MediaQueryList objects
      // returned by matchMedia, never on `document` itself.
      expect(documentAddSpy).not.toHaveBeenCalled();
      expect(documentRemoveSpy).not.toHaveBeenCalled();

      // Assert — ResizeObserver: DP-12 pins the CURRENT double-observe (one
      // observer, two observe() targets sharing a single callback:
      // document.documentElement and document.body — ScrollProgress.tsx
      // lines ~121-123). This is a pre-existing wart the Wave-4 refactor
      // should reconsider; this net holds TODAY's behavior, not the ideal.
      expect(MockResizeObserver.instances).toHaveLength(1);
      const resizeObserver = MockResizeObserver.instances[0];
      expect(resizeObserver.observe).toHaveBeenCalledTimes(2);
      expect(resizeObserver.unobserve).not.toHaveBeenCalled();
      expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);

      // Assert — IntersectionObserver: one observer, one observe() call per
      // tracked section, a single disconnect() on unmount releases all of
      // them (the source never calls unobserve() per-section).
      expect(MockIntersectionObserver.instances).toHaveLength(1);
      const sectionObserver = MockIntersectionObserver.instances[0];
      expect(sectionObserver.observe).toHaveBeenCalledTimes(SECTION_IDS.length);
      expect(sectionObserver.unobserve).not.toHaveBeenCalled();
      expect(sectionObserver.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------
  // 5. VISIBILITY GATE
  // ---------------------------------------------------------------------
  describe("visibility gate", () => {
    it("hides at the top before any scroll, shows once scrolling starts, and hides again after inactivity", async () => {
      // Arrange
      setViewport({ scrollHeight: 3000, innerHeight: 800 });
      installMatchMedia({ "(any-pointer: fine)": true });
      const { container } = renderScrollProgress();

      // Assert — "at top": isScrolling starts false, so the indicator is
      // absent even though hasPointerDevice/hasScrollbar are already true.
      expect(getIndicator(container)).not.toBeInTheDocument();

      // Act — scroll
      await scrollTo(500);

      // Assert — scrolled: visible
      expect(getIndicator(container)).toBeInTheDocument();

      // Act — wait past the idle delay. SCROLL_IDLE_DELAY_MS is a private,
      // unexported source constant; mirrored here so a future retune makes
      // this test fail loudly instead of silently passing against a stale
      // assumption (see useCarouselWheel.test.ts for the same convention).
      //
      // Real timers only, not vi.useFakeTimers(): the idle-hide setTimeout
      // is armed from inside the scrollY "change" handler, which itself
      // only ever runs via framer-motion's real-rAF-driven pipeline (see
      // the file-level comment) — there is no fake-timer-reachable moment
      // at which that setTimeout call could be intercepted.
      const MIRRORED_SCROLL_IDLE_DELAY_MS = 500;
      await waitFor(
        () => {
          expect(getIndicator(container)).not.toBeInTheDocument();
        },
        { timeout: MIRRORED_SCROLL_IDLE_DELAY_MS + 1500, interval: 50 },
      );
    });
  });
});
