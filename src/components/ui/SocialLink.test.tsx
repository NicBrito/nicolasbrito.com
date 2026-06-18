import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SocialLink } from "./SocialLink";

// ---------------------------------------------------------------------------
// framer-motion mock — renders plain <a> elements and strips animation props.
// ---------------------------------------------------------------------------

type MockMotionAnchorProps = {
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock("framer-motion", () => ({
  motion: {
    a: ({ children, ...props }: MockMotionAnchorProps) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.whileTap;
      delete domProps.whileHover;
      delete domProps.whileFocus;

      return <a {...(domProps as AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>;
    },
  },
}));

const MOCK_ICON = <span data-testid="mock-icon">📱</span>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SocialLink", () => {
  it("RENDERS LINK WITH CORRECT HREF", () => {
    // Arrange
    // Act
    render(
      <SocialLink
        href="https://linkedin.com/in/nicolasbritobarros"
        icon={MOCK_ICON}
        label="LinkedIn"
      />,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://linkedin.com/in/nicolasbritobarros");
  });

  it("RENDERS WITH CORRECT ARIA-LABEL FOR ACCESSIBILITY", () => {
    // Arrange
    // Act
    render(
      <SocialLink
        href="https://github.com/nicolasbrito"
        icon={MOCK_ICON}
        label="GitHub"
      />,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label", "GitHub");
  });

  it("RENDERS ICON CORRECTLY", () => {
    // Arrange
    // Act
    render(
      <SocialLink href="https://linkedin.com" icon={MOCK_ICON} label="LinkedIn" />,
    );

    // Assert
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("OPENS IN NEW TAB BY DEFAULT", () => {
    // Arrange
    // Act
    render(
      <SocialLink href="https://linkedin.com" icon={MOCK_ICON} label="LinkedIn" />,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("RESPECTS CUSTOM TARGET PROP", () => {
    // Arrange
    // Act
    render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
        target="_self"
      />,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_self");
  });

  it("RESPECTS CUSTOM REL PROP", () => {
    // Arrange
    // Act
    render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
        rel="noopener"
      />,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("APPLIES BASE STYLING CLASSES", () => {
    // Arrange
    // Act
    const { container } = render(
      <SocialLink href="https://linkedin.com" icon={MOCK_ICON} label="LinkedIn" />,
    );

    // Assert
    const link = container.querySelector("a");
    expect(link).toHaveClass("group");
    expect(link).toHaveClass("rounded-[22%]");
    expect(link).toHaveClass("backdrop-blur-md");
  });

  it("APPLIES CUSTOM CLASSNAME", () => {
    // Arrange
    // Act
    const { container } = render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
        className="custom-class"
      />,
    );

    // Assert
    const link = container.querySelector(".custom-class");
    expect(link).toBeInTheDocument();
  });

  it("RENDERS MULTIPLE SOCIAL LINKS", () => {
    // Arrange
    // Act
    const { container } = render(
      <div>
        <SocialLink href="https://linkedin.com" icon={MOCK_ICON} label="LinkedIn" />
        <SocialLink href="https://github.com" icon={MOCK_ICON} label="GitHub" />
      </div>,
    );

    // Assert
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(2);
  });

  it("ICON HAS HOVER ANIMATION CLASSES", () => {
    // Arrange
    // Act
    const { container } = render(
      <SocialLink href="https://linkedin.com" icon={MOCK_ICON} label="LinkedIn" />,
    );

    // Assert
    const iconWrapper = container.querySelector(".group-hover\\:scale-110");
    expect(iconWrapper).toBeInTheDocument();
  });

  it("HANDLES DIFFERENT SOCIAL NETWORKS", () => {
    // Arrange
    const networks = [
      { href: "https://linkedin.com/in/user", label: "LinkedIn" },
      { href: "https://github.com/user", label: "GitHub" },
      { href: "https://twitter.com/user", label: "Twitter" },
      { href: "https://facebook.com/user", label: "Facebook" },
    ];

    // Act
    render(
      <div>
        {networks.map((network) => (
          <SocialLink
            key={network.label}
            href={network.href}
            icon={MOCK_ICON}
            label={network.label}
          />
        ))}
      </div>,
    );

    // Assert
    networks.forEach((network) => {
      const link = screen.getByLabelText(network.label);
      expect(link).toHaveAttribute("href", network.href);
    });
  });

  it("RENDERS WITH GRADIENT BACKGROUND CLASSES", () => {
    // Arrange
    // Act
    const { container } = render(
      <SocialLink href="https://linkedin.com" icon={MOCK_ICON} label="LinkedIn" />,
    );

    // Assert
    const link = container.querySelector("a");
    expect(link).toHaveClass("bg-gradient-to-br");
  });

  it("HAS FOCUS RING FOR ACCESSIBILITY", () => {
    // Arrange
    // Act
    const { container } = render(
      <SocialLink href="https://linkedin.com" icon={MOCK_ICON} label="LinkedIn" />,
    );

    // Assert
    const link = container.querySelector("a");
    expect(link).toHaveClass("focus-visible:ring-2");
    expect(link).toHaveClass("focus-visible:ring-accent");
  });
});
