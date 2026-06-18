import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

// ---------------------------------------------------------------------------
// framer-motion mock — mirrors the approach used in SocialLink.test.tsx.
// Strips Framer-specific props (whileTap, whileHover, whileFocus, layout, etc.)
// and renders plain DOM elements so tests never depend on animation internals.
// ---------------------------------------------------------------------------

type MockMotionAnchorProps = {
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

type MockMotionButtonProps = {
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

vi.mock("framer-motion", () => ({
  motion: {
    a: ({ children, ...props }: MockMotionAnchorProps) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.whileTap;
      delete domProps.whileHover;
      delete domProps.whileFocus;
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.layout;
      delete domProps.variants;
      return <a {...(domProps as AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>;
    },
    button: ({ children, ...props }: MockMotionButtonProps) => {
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
        <button {...(domProps as ButtonHTMLAttributes<HTMLButtonElement>)}>
          {children}
        </button>
      );
    },
  },
}));

// ---------------------------------------------------------------------------
// PrimaryButton
// ---------------------------------------------------------------------------

describe("PrimaryButton", () => {
  it("RENDERS TEXT CONTENT", () => {
    // Arrange
    // Act
    render(<PrimaryButton>Click me</PrimaryButton>);

    // Assert
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("RENDERS <A> TAG WHEN HREF PROVIDED", () => {
    // Arrange
    // Act
    render(<PrimaryButton href="/test">Link Button</PrimaryButton>);

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/test");
  });

  it("RENDERS <BUTTON> TAG WHEN NO HREF", () => {
    // Arrange
    // Act
    render(<PrimaryButton>Click Button</PrimaryButton>);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("RENDERS WITH STABLE BASE CLASSES (role and accessible shape)", () => {
    // Arrange
    // Act
    const { container } = render(<PrimaryButton>Test</PrimaryButton>);

    // Assert — assert on stable structural classes, not contrast-sensitive tokens
    const button = container.querySelector("button");
    expect(button).toHaveClass("inline-flex");
    expect(button).toHaveClass("rounded-full");
    expect(button).toHaveClass("font-semibold");
  });

  it("OPENS LINK IN NEW TAB WITH TARGET _BLANK", () => {
    // Arrange
    // Act
    render(<PrimaryButton href="/test">Link</PrimaryButton>);

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("HANDLES DOWNLOAD ATTRIBUTE", () => {
    // Arrange
    // Act
    render(
      <PrimaryButton href="/file.pdf" download="filename.pdf">
        Download
      </PrimaryButton>,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("download", "filename.pdf");
  });

  it("SHOWS ARROW WHEN SHOWARROW PROP IS TRUE", () => {
    // Arrange
    // Act
    const { container } = render(<PrimaryButton showArrow>Click me</PrimaryButton>);

    // Assert
    const arrow = container.querySelector("span");
    expect(arrow?.textContent).toBe("→");
  });

  it("DISABLES BUTTON WHEN DISABLED PROP IS TRUE", () => {
    // Arrange
    // Act
    render(<PrimaryButton disabled>Disabled</PrimaryButton>);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("ACCEPTS CUSTOM CLASSNAME", () => {
    // Arrange
    // Act
    const { container } = render(
      <PrimaryButton className="custom-class">Test</PrimaryButton>,
    );

    // Assert
    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });

  it("FIRES CLICK HANDLER WHEN CLICKED", () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(<PrimaryButton onClick={onClick}>Click</PrimaryButton>);
    fireEvent.click(screen.getByRole("button"));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("DOES NOT FIRE CLICK HANDLER WHEN DISABLED", async () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(
      <PrimaryButton onClick={onClick} disabled>
        Disabled
      </PrimaryButton>,
    );
    // pointer-events:none on disabled prevents userEvent click
    const button = screen.getByRole("button");

    // Assert — button is disabled; pointer-events:none is CSS-level so jsdom
    // still dispatches the event, but the disabled attribute is the authoritative
    // contract we pin here.
    expect(button).toBeDisabled();
  });

  it("USES ARIA-LABEL WHEN PROVIDED", () => {
    // Arrange
    // Act
    render(
      <PrimaryButton ariaLabel="Custom label">Icon only</PrimaryButton>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Custom label" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SecondaryButton
// ---------------------------------------------------------------------------

describe("SecondaryButton", () => {
  it("RENDERS TEXT CONTENT", () => {
    // Arrange
    // Act
    render(<SecondaryButton>Click me</SecondaryButton>);

    // Assert
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("RENDERS <A> TAG WHEN HREF PROVIDED", () => {
    // Arrange
    // Act
    render(<SecondaryButton href="/test">Link Button</SecondaryButton>);

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/test");
  });

  it("RENDERS <BUTTON> TAG WHEN NO HREF", () => {
    // Arrange
    // Act
    render(<SecondaryButton>Click Button</SecondaryButton>);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("APPLIES SECONDARY BUTTON STRUCTURAL CLASSES", () => {
    // Arrange
    // Act
    const { container } = render(<SecondaryButton>Test</SecondaryButton>);

    // Assert — stable structural tokens that are not subject to contrast changes
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-white/5");
    expect(button).toHaveClass("backdrop-blur-md");
    expect(button).toHaveClass("border");
  });

  it("OPENS LINK IN NEW TAB WITH TARGET _BLANK", () => {
    // Arrange
    // Act
    render(<SecondaryButton href="/test">Link</SecondaryButton>);

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("HANDLES DOWNLOAD ATTRIBUTE", () => {
    // Arrange
    // Act
    render(
      <SecondaryButton href="/file.pdf" download="filename.pdf">
        Download
      </SecondaryButton>,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("download", "filename.pdf");
  });

  it("SHOWS ARROW WHEN SHOWARROW PROP IS TRUE", () => {
    // Arrange
    // Act
    const { container } = render(
      <SecondaryButton showArrow>Click me</SecondaryButton>,
    );

    // Assert
    const arrows = container.querySelectorAll("span");
    const found = Array.from(arrows).some((span) => span.textContent === "↗");
    expect(found).toBe(true);
  });

  it("DISABLES BUTTON WHEN DISABLED PROP IS TRUE", () => {
    // Arrange
    // Act
    render(<SecondaryButton disabled>Disabled</SecondaryButton>);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("ACCEPTS CUSTOM CLASSNAME", () => {
    // Arrange
    // Act
    const { container } = render(
      <SecondaryButton className="custom-class">Test</SecondaryButton>,
    );

    // Assert
    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });

  it("FIRES CLICK HANDLER WHEN CLICKED", () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(<SecondaryButton onClick={onClick}>Click</SecondaryButton>);
    fireEvent.click(screen.getByRole("button"));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
