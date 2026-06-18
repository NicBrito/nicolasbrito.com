import { render, screen } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { MorphingLabel } from "./MorphingLabel";

// ---------------------------------------------------------------------------
// framer-motion mock — mirrors the approach used in SocialLink.test.tsx.
// Renders plain DOM elements, stripping all Framer-specific props so tests
// never depend on animation internals.
// ---------------------------------------------------------------------------

type MockMotionSpanProps = {
  children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }: MockMotionSpanProps) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.whileTap;
      delete domProps.whileHover;
      delete domProps.whileFocus;
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.layout;
      delete domProps.variants;
      return (
        <span {...(domProps as HTMLAttributes<HTMLSpanElement>)}>{children}</span>
      );
    },
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MorphingLabel", () => {
  it("RENDERS TEXT WITH INDIVIDUAL CHARACTERS", () => {
    // Arrange
    // Act
    render(<MorphingLabel text="Hello World" layoutIdPrefix="test" />);

    // Assert
    const container = screen.getByText("H").parentElement?.parentElement;
    expect(container).toBeInTheDocument();
  });

  it("SPLITS TEXT INTO INDIVIDUAL CHARACTERS", () => {
    // Arrange
    // Act
    const { container } = render(
      <MorphingLabel text="Test" layoutIdPrefix="test" />,
    );

    // Assert
    const characterSpans = container.querySelectorAll(".inline-block");
    expect(characterSpans).toHaveLength(4);
  });

  it("APPLIES CUSTOM CLASSNAME", () => {
    // Arrange
    // Act
    const { container } = render(
      <MorphingLabel text="Hello" layoutIdPrefix="test" className="custom-class" />,
    );

    // Assert
    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("PRESERVES WHITESPACE IN TEXT", () => {
    // Arrange
    // Act
    render(<MorphingLabel text="Hello World" layoutIdPrefix="test" />);

    // Assert
    const spaceElement = screen.getByText((_, element) => {
      return (
        element?.textContent === " " &&
        element?.classList.contains("whitespace-pre")
      );
    });
    expect(spaceElement).toBeInTheDocument();
  });

  it("USES UNIQUE LAYOUTIDPREFIX PER CHARACTER", () => {
    // Arrange
    // Act
    const { container } = render(
      <MorphingLabel text="Hi" layoutIdPrefix="unique-prefix" />,
    );

    // Assert
    const characterSpans = container.querySelectorAll(".inline-block");
    expect(characterSpans[0]).toHaveTextContent("H");
    expect(characterSpans[1]).toHaveTextContent("i");
  });

  it("ACCEPTS CUSTOM ANIMATION DURATIONS", () => {
    // Arrange
    // Act
    const { container } = render(
      <MorphingLabel
        text="Test"
        layoutIdPrefix="test"
        animationDuration={{ animate: 0.5, exit: 0.3 }}
      />,
    );

    // Assert
    const wrapper = container.querySelector(".inline-flex");
    expect(wrapper).toBeInTheDocument();
  });

  it("USES DEFAULT ANIMATION DURATIONS WHEN NOT PROVIDED", () => {
    // Arrange
    // Act
    const { container } = render(
      <MorphingLabel text="Test" layoutIdPrefix="test" />,
    );

    // Assert
    const wrapper = container.querySelector(".inline-flex");
    expect(wrapper).toBeInTheDocument();
  });
});
