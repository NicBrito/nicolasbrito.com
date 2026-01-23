import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SocialLink } from "./SocialLink";

vi.mock("framer-motion", () => ({
  motion: {
    a: ({ children, whileHover, onHoverStart, ...props }: any) => <a {...props}>{children}</a>,
  },
}));

const MOCK_ICON = <span data-testid="mock-icon">📱</span>;

describe("SocialLink", () => {
  it("RENDERS LINK WITH CORRECT HREF", () => {
    render(
      <SocialLink
        href="https://linkedin.com/in/nicolasbritobarros"
        icon={MOCK_ICON}
        label="LinkedIn"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://linkedin.com/in/nicolasbritobarros");
  });

  it("RENDERS WITH CORRECT ARIA-LABEL FOR ACCESSIBILITY", () => {
    render(
      <SocialLink
        href="https://github.com/nicolasbrito"
        icon={MOCK_ICON}
        label="GitHub"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label", "GitHub");
  });

  it("RENDERS ICON CORRECTLY", () => {
    render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
      />
    );

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("OPENS IN NEW TAB BY DEFAULT", () => {
    render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("RESPECTS CUSTOM TARGET PROP", () => {
    render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
        target="_self"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_self");
  });

  it("RESPECTS CUSTOM REL PROP", () => {
    render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
        rel="noopener"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("APPLIES BASE STYLING CLASSES", () => {
    const { container } = render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
      />
    );

    const link = container.querySelector("a");
    expect(link).toHaveClass("group");
    expect(link).toHaveClass("rounded-[22%]");
    expect(link).toHaveClass("backdrop-blur-md");
  });

  it("APPLIES CUSTOM CLASSNAME", () => {
    const { container } = render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
        className="custom-class"
      />
    );

    const link = container.querySelector(".custom-class");
    expect(link).toBeInTheDocument();
  });

  it("RENDERS MULTIPLE SOCIAL LINKS", () => {
    const { container } = render(
      <div>
        <SocialLink href="https://linkedin.com" icon={MOCK_ICON} label="LinkedIn" />
        <SocialLink href="https://github.com" icon={MOCK_ICON} label="GitHub" />
      </div>
    );

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(2);
  });

  it("ICON HAS HOVER ANIMATION CLASSES", () => {
    const { container } = render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
      />
    );

    const iconWrapper = container.querySelector(".group-hover\\:scale-110");
    expect(iconWrapper).toBeInTheDocument();
  });

  it("HANDLES DIFFERENT SOCIAL NETWORKS", () => {
    const networks = [
      { href: "https://linkedin.com/in/user", label: "LinkedIn" },
      { href: "https://github.com/user", label: "GitHub" },
      { href: "https://twitter.com/user", label: "Twitter" },
      { href: "https://facebook.com/user", label: "Facebook" },
    ];

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
      </div>
    );

    networks.forEach((network) => {
      const link = screen.getByLabelText(network.label);
      expect(link).toHaveAttribute("href", network.href);
    });
  });

  it("RENDERS WITH GRADIENT BACKGROUND CLASSES", () => {
    const { container } = render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
      />
    );

    const link = container.querySelector("a");
    expect(link).toHaveClass("bg-gradient-to-br");
  });

  it("HAS FOCUS RING FOR ACCESSIBILITY", () => {
    const { container } = render(
      <SocialLink
        href="https://linkedin.com"
        icon={MOCK_ICON}
        label="LinkedIn"
      />
    );

    const link = container.querySelector("a");
    expect(link).toHaveClass("focus-visible:ring-2");
    expect(link).toHaveClass("focus-visible:ring-accent");
  });
});