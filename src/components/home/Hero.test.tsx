import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/en.json";
import { Hero } from "./Hero";

// ---------------------------------------------------------------------------
// Hero — LCP-at-rest regression pin (audit finding NEW-5).
//
// Scope: this suite pins ONE measured perf property introduced by the
// title-only entry variant in Hero.tsx — the <h1> (name) and the role <span>
// beneath it must resolve an initial ("hidden") motion state that declares
// neither `opacity` nor `filter`, so the LCP element paints at rest instead
// of starting invisible/blurred (served HTML went from
// `opacity:0;filter:blur(10px);transform:translateY(40px)` to
// `transform:translateY(12px)`; observed LCP fell 1141ms -> 38ms). It also
// pins that the fix is surgical — the description <p> is untouched and still
// starts from the pre-existing staged entry (opacity 0 + blur) — and that
// prefers-reduced-motion stays additive: the title block gets NO variant at
// all, never more motion than the default path. It deliberately does NOT pin
// animation duration/easing, and does not assert "a heading exists" as a
// vanity check — this repo's testing rules forbid superficial tests for
// visual shells, and a full Hero smoke test would inflate coverage without
// catching the one regression this suite exists to prevent.
//
// framer-motion is mocked below, mirroring the vi.hoisted `useReducedMotion`
// + inline prop-stripping factory from GamesSection.test.tsx, but with ONE
// deliberate deviation: GamesSection's factory strips every Framer-only prop
// (including `variants`) so motion.* renders as plain, queryable DOM — which
// would erase exactly the property this suite exists to observe. Instead,
// whenever a `variants` prop is supplied, this mock resolves its `hidden`
// (initial/at-rest) entry and JSON-serializes it onto the element as
// `data-initial-variant`: deterministic and directly assertable, with no
// need to reimplement Framer's x/y-to-transform translation just for a test
// double. When Hero passes no `variants` prop at all (the reduced-motion
// title path passes `variants={undefined}`), the attribute is omitted
// entirely, so "no variant" and "a variant with no opacity/filter" stay
// distinguishable. `initial`/`animate`/`transition` and the other
// interaction-only Framer props are still stripped and discarded exactly as
// in GamesSection, since nothing in this suite depends on them.
// ---------------------------------------------------------------------------

const { mockUseReducedMotion } = vi.hoisted(() => ({
  mockUseReducedMotion: vi.fn(() => false),
}));

vi.mock("framer-motion", () => {
  const FRAMER_ONLY_PROPS = [
    // NOTE: `variants` is deliberately absent from this list — it is
    // intercepted and resolved by surfaceResolvedVariant below instead of
    // being discarded.
    "initial", "animate", "exit", "transition", "custom",
    "whileHover", "whileTap", "whileFocus", "whileDrag", "whileInView", "viewport",
    "layout", "layoutId", "drag", "dragConstraints", "dragElastic", "dragMomentum",
    "onHoverStart", "onHoverEnd", "onPanEnd", "onPan", "onDrag", "onDragStart", "onDragEnd",
    "onAnimationStart", "onAnimationComplete",
  ] as const;
  const FRAMER_ONLY_PROP_SET = new Set<string>(FRAMER_ONLY_PROPS);

  function stripFramerProps(props: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!FRAMER_ONLY_PROP_SET.has(key)) result[key] = value;
    }
    return result;
  }

  function isVariantsWithHidden(value: unknown): value is { hidden: unknown } {
    return typeof value === "object" && value !== null && "hidden" in value;
  }

  // Resolves `variants.hidden` — the initial/at-rest state Framer would
  // paint before animating to "visible" — and JSON-serializes it onto the
  // element as `data-initial-variant`, so a test can read exactly which
  // style-like keys the SSR'd element would have carried. No `variants`
  // prop at all leaves the attribute unset entirely (never a stringified
  // "undefined"/"null"), so its absence is unambiguous.
  function surfaceResolvedVariant(props: Record<string, unknown>): Record<string, unknown> {
    const { variants, ...rest } = props;
    const result = stripFramerProps(rest);
    if (isVariantsWithHidden(variants)) {
      result["data-initial-variant"] = JSON.stringify(variants.hidden);
    }
    return result;
  }

  const MotionDiv = forwardRef<HTMLDivElement, Record<string, unknown>>(function MotionDiv(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <div ref={ref} {...(surfaceResolvedVariant(rest) as HTMLAttributes<HTMLDivElement>)}>
        {children as ReactNode}
      </div>
    );
  });

  const MotionH1 = forwardRef<HTMLHeadingElement, Record<string, unknown>>(function MotionH1(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <h1 ref={ref} {...(surfaceResolvedVariant(rest) as HTMLAttributes<HTMLHeadingElement>)}>
        {children as ReactNode}
      </h1>
    );
  });

  const MotionSpan = forwardRef<HTMLSpanElement, Record<string, unknown>>(function MotionSpan(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <span ref={ref} {...(surfaceResolvedVariant(rest) as HTMLAttributes<HTMLSpanElement>)}>
        {children as ReactNode}
      </span>
    );
  });

  const MotionP = forwardRef<HTMLParagraphElement, Record<string, unknown>>(function MotionP(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <p ref={ref} {...(surfaceResolvedVariant(rest) as HTMLAttributes<HTMLParagraphElement>)}>
        {children as ReactNode}
      </p>
    );
  });

  const MotionAnchor = forwardRef<HTMLAnchorElement, Record<string, unknown>>(function MotionAnchor(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return (
      <a ref={ref} {...(surfaceResolvedVariant(rest) as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children as ReactNode}
      </a>
    );
  });

  return {
    motion: { div: MotionDiv, h1: MotionH1, span: MotionSpan, p: MotionP, a: MotionAnchor },
    useReducedMotion: mockUseReducedMotion,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderHero() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Hero />
    </NextIntlClientProvider>,
  );
}

/** Parses the mock's `data-initial-variant` payload; null if Hero passed no `variants` prop at all. */
function initialVariantOf(element: HTMLElement): Record<string, unknown> | null {
  const raw = element.getAttribute("data-initial-variant");
  return raw === null ? null : (JSON.parse(raw) as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Hero", () => {
  afterEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
  });

  it("RENDERS THE H1 WITH THE LOCALIZED NAME AND NO OPACITY OR FILTER IN ITS INITIAL VARIANT, SO THE LCP ELEMENT PAINTS AT REST (NEW-5)", () => {
    // Arrange
    // Act
    renderHero();
    const heading = screen.getByRole("heading", { level: 1, name: messages.Hero.name });
    const initialVariant = initialVariantOf(heading);

    // Assert
    expect(initialVariant, "the h1 must resolve a `variants` prop to inspect").not.toBeNull();
    expect(
      initialVariant,
      "LCP element must not start hidden — `opacity` must be absent from its initial variant (NEW-5)",
    ).not.toHaveProperty("opacity");
    expect(
      initialVariant,
      "LCP element must not start blurred — `filter` must be absent from its initial variant (NEW-5)",
    ).not.toHaveProperty("filter");
  });

  it("RENDERS THE ROLE SPAN WITH NO OPACITY OR FILTER IN ITS INITIAL VARIANT EITHER (NEW-5)", () => {
    // Arrange
    // Act
    renderHero();
    const roleSpan = screen.getByText(messages.Hero.role);
    const initialVariant = initialVariantOf(roleSpan);

    // Assert
    expect(initialVariant, "the role span must resolve a `variants` prop to inspect").not.toBeNull();
    expect(
      initialVariant,
      "title block must not start hidden — `opacity` must be absent from its initial variant (NEW-5)",
    ).not.toHaveProperty("opacity");
    expect(
      initialVariant,
      "title block must not start blurred — `filter` must be absent from its initial variant (NEW-5)",
    ).not.toHaveProperty("filter");
  });

  it("KEEPS THE DESCRIPTION PARAGRAPH ON ITS PRE-EXISTING STAGED ENTRY (OPACITY 0 + BLUR), PROVING THE NEW-5 FIX WAS SURGICAL", () => {
    // Arrange
    // Act
    renderHero();
    const description = screen.getByText(messages.Hero.description);
    const initialVariant = initialVariantOf(description);

    // Assert
    expect(
      initialVariant,
      "the description is unrelated to NEW-5 and must keep its pre-existing staged entry",
    ).toMatchObject({ opacity: 0, filter: "blur(10px)" });
  });

  it("GIVES THE TITLE BLOCK NO VARIANT AT ALL UNDER PREFERS-REDUCED-MOTION — NEVER MORE MOTION THAN THE DEFAULT PATH", () => {
    // Arrange
    mockUseReducedMotion.mockReturnValue(true);

    // Act
    renderHero();
    const heading = screen.getByRole("heading", { level: 1, name: messages.Hero.name });
    const roleSpan = screen.getByText(messages.Hero.role);

    // Assert
    expect(
      initialVariantOf(heading),
      "reduced motion must drop the h1's variant entirely, not merely blank its fields",
    ).toBeNull();
    expect(
      initialVariantOf(roleSpan),
      "reduced motion must drop the role span's variant entirely too",
    ).toBeNull();
  });
});
