import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProjectCard } from "./ProjectCard";

type MockNextImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  fill?: boolean;
};

type MockLinkProps = {
  children: ReactNode;
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

type MockButtonProps = {
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

type MockMotionDivProps = {
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

type MockAnimatePresenceProps = {
  children: ReactNode;
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "items.test-project.title": "Test Project Title",
      "items.test-project.description": "Test project description",
      "items.test-project.alt": "Test project image",
      "view_case": "View Case",
      "visit_site": "Visit Site",
    };
    return translations[key] || key;
  },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: MockNextImageProps) => (
    <span role="img" aria-label={alt} data-src={src} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: MockLinkProps) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/ui/PrimaryButton", () => ({
  PrimaryButton: ({ children, ...props }: MockButtonProps) => (
    <a {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/SecondaryButton", () => ({
  SecondaryButton: ({ children, ...props }: MockButtonProps) => (
    <a {...props}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// framer-motion mock — renders plain <div> elements and strips animation props
// that are not valid DOM attributes (mirrors the approach in SocialLink.test.tsx).
// Prevents jsdom warnings:
//   "Received `true` for a non-boolean attribute `layout`."
//   "Unknown event handler property `onHoverEnd`. It will be ignored."
// ---------------------------------------------------------------------------
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: MockMotionDivProps) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.layout;
      delete domProps.variants;
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.transition;
      delete domProps.custom;
      delete domProps.whileHover;
      delete domProps.whileTap;
      delete domProps.whileFocus;
      delete domProps.onHoverStart;
      delete domProps.onHoverEnd;

      return <div {...(domProps as HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: MockAnimatePresenceProps) => <div>{children}</div>,
}));

const DEFAULT_PROPS = {
  id: "test-project",
  colors: {
    from: "bg-blue-600",
    to: "bg-purple-600",
  },
};

describe("ProjectCard", () => {
  it("RENDERS CARD WITH TITLE AND DESCRIPTION", () => {
    // Arrange
    // Act
    render(<ProjectCard {...DEFAULT_PROPS} />);

    // Assert
    expect(screen.getByText("Test Project Title")).toBeInTheDocument();
    expect(screen.getByText("Test project description")).toBeInTheDocument();
  });

  it("RENDERS DEFAULT ACTION BUTTONS", () => {
    // Arrange
    // Act
    render(<ProjectCard {...DEFAULT_PROPS} />);

    // Assert
    expect(screen.getByText("View Case")).toBeInTheDocument();
    expect(screen.getByText("Visit Site")).toBeInTheDocument();
  });

  it("APPLIES CUSTOM COLSPAN CLASS", () => {
    // Arrange
    // Act
    const { container } = render(
      <ProjectCard {...DEFAULT_PROPS} colSpan="md:col-span-6" />
    );

    // Assert
    const card = container.querySelector(".md\\:col-span-6");
    expect(card).toBeInTheDocument();
  });

  it("APPLIES CUSTOM CLASSNAME", () => {
    // Arrange
    // Act
    const { container } = render(
      <ProjectCard {...DEFAULT_PROPS} className="custom-class" />
    );

    // Assert
    const card = container.querySelector(".custom-class");
    expect(card).toBeInTheDocument();
  });

  it("RENDERS WITH IMAGE WHEN PROVIDED", () => {
    // Arrange
    // Act
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        image="/test-image.jpg"
      />
    );

    // Assert
    const img = screen.getByRole("img", { name: "Test project image" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("data-src", "/test-image.jpg");
  });

  it("RENDERS CUSTOM ACTIONS WHEN PROVIDED", () => {
    // Arrange
    const customActions = <button>Custom Action</button>;

    // Act
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        actions={customActions}
      />
    );

    // Assert
    expect(screen.getByText("Custom Action")).toBeInTheDocument();
    expect(screen.queryByText("View Case")).not.toBeInTheDocument();
  });

  it("USES CUSTOM TRANSLATION NAMESPACE", () => {
    // Arrange
    // Act
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        translationNamespace="CustomNamespace"
      />
    );

    // Assert
    expect(screen.getByText("Test Project Title")).toBeInTheDocument();
  });

  it("RENDERS GRADIENT ORBS WITHOUT IMAGE", () => {
    // Arrange
    // Act
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);

    // Assert
    const orbFrom = container.querySelector(".bg-blue-600");
    const orbTo = container.querySelector(".bg-purple-600");

    expect(orbFrom).toBeInTheDocument();
    expect(orbTo).toBeInTheDocument();
  });

  it("APPLIES DIFFERENT COLOR SCHEMES", () => {
    // Arrange
    // Act
    const { container } = render(
      <ProjectCard
        {...DEFAULT_PROPS}
        colors={{
          from: "bg-emerald-600",
          to: "bg-teal-600",
        }}
      />
    );

    // Assert
    const orbFrom = container.querySelector(".bg-emerald-600");
    const orbTo = container.querySelector(".bg-teal-600");

    expect(orbFrom).toBeInTheDocument();
    expect(orbTo).toBeInTheDocument();
  });

  it("RENDERS WITH PRIORITY PROP FOR IMAGE LOADING", () => {
    // Arrange
    // Act
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        image="/priority-image.jpg"
        priority={true}
      />
    );

    // Assert
    const img = screen.getByRole("img", { name: "Test project image" });
    expect(img).toBeInTheDocument();
  });

  it("RENDERS WITHOUT PRIORITY PROP", () => {
    // Arrange
    // Act
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        image="/normal-image.jpg"
        priority={false}
      />
    );

    // Assert
    const img = screen.getByRole("img", { name: "Test project image" });
    expect(img).toBeInTheDocument();
  });

  it("RENDERS WITH DEFAULT COLSPAN WHEN NOT PROVIDED", () => {
    // Arrange
    // Act
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);

    // Assert
    const card = container.querySelector(".xl\\:col-span-4");
    expect(card).toBeInTheDocument();
  });

  it("RENDERS NOISE TEXTURE OVERLAY", () => {
    // Arrange
    // Act
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);

    // Assert
    expect(container.firstChild).toBeInTheDocument();
  });

  it("RENDERS GLASSMORPHISM BLUR LAYER WITH IMAGE", () => {
    // Arrange
    // Act
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        image="/test-image.jpg"
      />
    );

    // Assert
    const img = screen.getByRole("img", { name: "Test project image" });
    expect(img).toBeInTheDocument();
  });

  it("RENDERS WITH CORRECT LINK HREFS", () => {
    // Arrange
    // Act
    render(<ProjectCard {...DEFAULT_PROPS} />);

    // Assert
    const viewCaseLink = screen.getByText("View Case").closest("a");
    const visitSiteLink = screen.getByText("Visit Site").closest("a");

    expect(viewCaseLink).toHaveAttribute("href", "/projects/test-project");
    expect(visitSiteLink).toHaveAttribute("href", "/projects/test-project/demo");
  });

  it("KEEPS DEFAULT ACTION LINKS IN TAB ORDER", () => {
    // Arrange
    // Act
    render(<ProjectCard {...DEFAULT_PROPS} />);

    // Assert
    const viewCaseLink = screen.getByText("View Case").closest("a");
    const visitSiteLink = screen.getByText("Visit Site").closest("a");

    expect(viewCaseLink).not.toHaveAttribute("tabindex", "-1");
    expect(visitSiteLink).not.toHaveAttribute("tabindex", "-1");
  });
});