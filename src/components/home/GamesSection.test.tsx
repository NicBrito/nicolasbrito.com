import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/en.json";
import { GAMES } from "./games/constants";
import { GamesSection } from "./GamesSection";

// ---------------------------------------------------------------------------
// GamesSection — shell-level regression pins.
//
// Scope: this suite pins the carousel SECTION SHELL — its localized heading/
// landmark structure, the ARIA-live slide announcement, the play/pause
// control's accessible state, and the active card's keyboard-focusable
// actions. It deliberately does NOT simulate wheel, drag/pan, or
// spring-physics gestures: jsdom has no layout engine (getBoundingClientRect
// always returns a zeroed rect, and jsdom implements neither ResizeObserver
// nor IntersectionObserver at all), so that class of behavior belongs in a
// real browser per this repo's standing lesson. The two hooks GamesSection
// composes (useCarouselWheel, useCarouselAutoplay) already carry their own
// deterministic unit suites — see the sibling ./games/useCarouselWheel.test.ts
// and ./games/useCarouselAutoplay.test.ts — and their internals are
// intentionally not re-tested here.
//
// framer-motion is mocked below (a vi.hoisted `useReducedMotion` plus an
// inline prop-stripping factory inside the vi.mock call), mirroring the
// pattern established in src/components/ui/ProjectCard.test.tsx: Framer-only
// props are stripped so every motion.* element renders as plain, queryable
// DOM instead of an animated black box. ResizeObserver and
// IntersectionObserver — absent from jsdom entirely — are stubbed locally to
// fire their callback synchronously with a fixed, positive layout so the
// card track and the sticky controls mount deterministically on every
// render, with no waitFor needed.
// ---------------------------------------------------------------------------

const { mockUseReducedMotion } = vi.hoisted(() => ({
  mockUseReducedMotion: vi.fn(() => false),
}));

vi.mock("framer-motion", () => {
  const FRAMER_ONLY_PROPS = [
    "initial", "animate", "exit", "variants", "transition", "custom",
    "whileHover", "whileTap", "whileFocus", "whileDrag", "whileInView", "viewport",
    "layout", "layoutId", "drag", "dragConstraints", "dragElastic", "dragMomentum",
    "onHoverStart", "onHoverEnd", "onPanEnd", "onPan", "onDrag", "onDragStart", "onDragEnd",
    "onAnimationStart", "onAnimationComplete",
  ] as const;
  const FRAMER_ONLY_PROP_SET = new Set<string>(FRAMER_ONLY_PROPS);

  // Copies only the non-Framer-only props instead of deleting keys in place,
  // so the result is a plain, freshly-built object safe to spread onto a
  // native DOM element.
  function stripFramerProps(props: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!FRAMER_ONLY_PROP_SET.has(key)) result[key] = value;
    }
    return result;
  }

  // Props are typed as a flat Record (not an interface with a `children`
  // field alongside an index signature): forwardRef's PropsWithoutRef/
  // RefAttributes plumbing resolves an intersected/explicit `children` key
  // back down to `unknown` whenever the prop type also carries a string
  // index signature (confirmed directly — TS2322 "unknown is not assignable
  // to ReactNode" — against an isolated repro). Destructuring inside the
  // function body and casting `children` at its one JSX usage site sidesteps
  // that inference gap entirely.
  const MotionDiv = forwardRef<HTMLDivElement, Record<string, unknown>>(function MotionDiv(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <div ref={ref} {...(stripFramerProps(rest) as HTMLAttributes<HTMLDivElement>)}>
        {children as ReactNode}
      </div>
    );
  });

  const MotionButton = forwardRef<HTMLButtonElement, Record<string, unknown>>(function MotionButton(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <button ref={ref} {...(stripFramerProps(rest) as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children as ReactNode}
      </button>
    );
  });

  const MotionSpan = forwardRef<HTMLSpanElement, Record<string, unknown>>(function MotionSpan(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <span ref={ref} {...(stripFramerProps(rest) as HTMLAttributes<HTMLSpanElement>)}>
        {children as ReactNode}
      </span>
    );
  });

  const MotionAnchor = forwardRef<HTMLAnchorElement, Record<string, unknown>>(function MotionAnchor(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <a ref={ref} {...(stripFramerProps(rest) as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children as ReactNode}
      </a>
    );
  });

  function MockAnimatePresence({ children }: { children?: ReactNode }) {
    return <>{children}</>;
  }

  return {
    motion: { div: MotionDiv, button: MotionButton, span: MotionSpan, a: MotionAnchor },
    AnimatePresence: MockAnimatePresence,
    useReducedMotion: mockUseReducedMotion,
  };
});

// ---------------------------------------------------------------------------
// ResizeObserver / IntersectionObserver — unimplemented in jsdom (confirmed:
// neither exists on jsdom's window). Both are stubbed here to invoke their
// callback synchronously and unconditionally from the first `observe()`
// call, so `containerWidth` (which mounts the card track) and
// `isInView`/`started`/`isControlsVisible` (which mount the sticky controls)
// all settle within the same initial render.
// ---------------------------------------------------------------------------

const FAKE_TRACK_WIDTH_PX = 1200;

class MockResizeObserver {
  constructor(private readonly callback: (entries: [{ contentRect: { width: number } }]) => void) {}
  observe(): void {
    this.callback([{ contentRect: { width: FAKE_TRACK_WIDTH_PX } }]);
  }
  unobserve(): void {}
  disconnect(): void {}
}

class MockIntersectionObserver {
  constructor(
    private readonly callback: (
      entries: [{ isIntersecting: boolean; boundingClientRect: { top: number } }],
    ) => void,
  ) {}
  observe(): void {
    this.callback([{ isIntersecting: true, boundingClientRect: { top: 0 } }]);
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return [];
  }
}

/** hasPointer comes from useMediaQuery(POINTER_QUERY) → window.matchMedia, also unimplemented in jsdom. */
function installMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderGamesSection() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GamesSection />
    </NextIntlClientProvider>,
  );
}

type GameId = keyof typeof messages.Games.items;

function gameTitle(id: string): string {
  return messages.Games.items[id as GameId].title;
}

function formatStatus(current: number, total: number, title: string): string {
  return messages.Games.progress.status
    .replace("{current}", String(current))
    .replace("{total}", String(total))
    .replace("{title}", title);
}

function dotLabel(zeroBasedIndex: number): string {
  return `${messages.Games.progress.go_to} ${zeroBasedIndex + 1}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GamesSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installMatchMedia(true); // hasPointer = true: a fine, hover-capable pointer
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    mockUseReducedMotion.mockReturnValue(false);
  });

  it("RENDERS THE LOCALIZED HEADING AND CAROUSEL LANDMARK STRUCTURE FROM THE GAMES CATALOG", () => {
    // Arrange
    // Act
    renderGamesSection();

    // Assert — localized section heading
    expect(
      screen.getByRole("heading", { level: 2, name: messages.Games.section_title }),
    ).toBeInTheDocument();

    // Assert — the outer <section id="games"> and the inner carousel
    // container BOTH resolve to an ARIA "region" sharing the same accessible
    // name: the <section> gets an implicit region role from its
    // aria-labelledby (pointing at the heading above), and the inner
    // container declares role="region" explicitly. Pinned as two distinct,
    // identically-named regions on purpose — see RISKS in the handback for
    // why this redundant landmark pairing is worth a second look rather than
    // silently "fixed" by a future edit to this suite.
    const regions = screen.getAllByRole("region", { name: messages.Games.section_title });
    expect(regions).toHaveLength(2);
    const carousel = regions.find((el) => el.getAttribute("aria-roledescription") === "carousel");
    expect(carousel).toBeDefined();
    expect(document.getElementById("games")).toBeInTheDocument();
  });

  it("RENDERS THE SAME SHELL WHEN REDUCED MOTION IS PREFERRED", () => {
    // Arrange
    mockUseReducedMotion.mockReturnValue(true);

    // Act
    renderGamesSection();

    // Assert
    expect(
      screen.getByRole("heading", { level: 2, name: messages.Games.section_title }),
    ).toBeInTheDocument();
    expect(document.getElementById("games")).toBeInTheDocument();
  });

  it("ANNOUNCES THE ACTIVE SLIDE VIA THE STATUS REGION AND UPDATES IT WHEN A DOT CONTROL CHANGES THE SLIDE", () => {
    // Arrange
    renderGamesSection();
    const status = screen.getByRole("status");

    // Assert — initial announcement, index 0
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(formatStatus(1, GAMES.length, gameTitle(GAMES[0].id)));

    // Act — navigate via the carousel's own dot control (not a raw index poke)
    const targetIndex = 2;
    fireEvent.click(screen.getByRole("tab", { name: dotLabel(targetIndex) }));

    // Assert — the SAME status node now announces the new slide
    expect(status).toHaveTextContent(
      formatStatus(targetIndex + 1, GAMES.length, gameTitle(GAMES[targetIndex].id)),
    );
  });

  it("REFLECTS THE AUTOPLAY STATE ON THE PLAY/PAUSE CONTROL AND TOGGLES IT ON ACTIVATION", () => {
    // Arrange
    renderGamesSection();

    // Assert — autoplay starts enabled, so the control's accessible name offers to pause it
    const toggle = screen.getByRole("button", { name: messages.Games.progress.pause });

    // Act
    fireEvent.click(toggle);

    // Assert — same control, now offering to resume playback
    expect(toggle).toHaveAttribute("aria-label", messages.Games.progress.play);
    expect(
      screen.queryByRole("button", { name: messages.Games.progress.pause }),
    ).not.toBeInTheDocument();
  });

  it("EXPOSES THE ACTIVE CARD'S ACTIONS AS FOCUSABLE CONTROLS IN DOM ORDER", () => {
    // Arrange
    renderGamesSection();

    // Assert — only the active (first) card's actions are mounted, both tabbable
    const viewLink = screen.getByRole("link", { name: messages.Games.view_game });
    const playLink = screen.getByRole("link", { name: messages.Games.play_now });
    expect(viewLink).toHaveAttribute("tabindex", "0");
    expect(playLink).toHaveAttribute("tabindex", "0");
    expect(
      viewLink.compareDocumentPosition(playLink) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Act — real DOM focus() (not fireEvent.focus) so jsdom's native,
    // bubbling focusin is what reaches the section's onFocusCapture, exactly
    // as a real Tab keypress would; act() flushes the isKeyboardFocused/
    // isPlaying state update that handler triggers as a side effect.
    act(() => {
      viewLink.focus();
    });

    // Assert — the active card's primary action actually receives focus
    expect(document.activeElement).toBe(viewLink);
  });
});
