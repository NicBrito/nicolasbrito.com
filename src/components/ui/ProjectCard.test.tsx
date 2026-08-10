import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectCard } from "./ProjectCard";

type MockNextImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  fill?: boolean;
  onLoad?: () => void;
  onError?: () => void;
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

// Renders a real <img> (not a <span role="img">) because React only
// attaches "load"/"error" as direct (non-delegated) DOM listeners for actual
// resource-loading elements — a <span role="img"> never receives them, so
// `fireEvent.load` / `fireEvent.error` below would silently no-op against
// one. A real <img alt=...> still keeps the implicit ARIA role "img" and
// accessible name the existing `getByRole("img", { name })` queries rely on.
vi.mock("next/image", () => ({
  default: ({ src, alt, onLoad, onError }: MockNextImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element -- test-only mock; LCP/bandwidth rule doesn't apply here.
    <img alt={alt} data-src={src} onLoad={onLoad} onError={onError} />
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
// `mockUseReducedMotion` defaults to false (motion enabled) so every existing
// test below renders through the exact reduced=false path it always has;
// individual tests opt into the reduced=true path via
// `mockUseReducedMotion.mockReturnValue(true)`. The card root's `animate`
// value is stripped before hitting the DOM like the rest, so it is
// re-surfaced as `data-motion-animate` (root wrapper only, identified by its
// unique "project-card" class) purely for that gate assertion.
// ---------------------------------------------------------------------------
const { mockUseReducedMotion } = vi.hoisted(() => ({
  mockUseReducedMotion: vi.fn(() => false),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: MockMotionDivProps) => {
      const domProps = { ...props } as Record<string, unknown>;
      const isCardRoot =
        typeof domProps.className === "string" &&
        domProps.className.split(" ").includes("project-card");
      const animateValue = domProps.animate;
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

      return (
        <div
          {...(domProps as HTMLAttributes<HTMLDivElement>)}
          {...(isCardRoot
            ? { "data-motion-animate": animateValue === undefined ? "none" : String(animateValue) }
            : {})}
        >
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: MockAnimatePresenceProps) => <div>{children}</div>,
  useReducedMotion: mockUseReducedMotion,
}));

const DEFAULT_PROPS = {
  id: "test-project",
  colors: {
    from: "bg-blue-600",
    to: "bg-purple-600",
  },
};

describe("ProjectCard", () => {
  afterEach(() => {
    // Reset shared mock state so the reduced=true opt-in below never leaks
    // into the reduced=false tests pinned above (or any test added later).
    mockUseReducedMotion.mockReturnValue(false);
  });

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

  it("SKIPS THE HOVER ANIMATE VARIANT ON THE ACTIVE CARD WHEN REDUCED MOTION IS PREFERRED", () => {
    // Arrange
    mockUseReducedMotion.mockReturnValue(true);
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);
    const card = container.querySelector(".project-card") as HTMLElement;

    // Act — focus is the one framer-motion interaction prop the mock passes
    // straight through as a real DOM handler (onHoverStart/onHoverEnd are
    // Framer-only prop names with no native DOM event to fire in jsdom).
    fireEvent.focus(card);

    // Assert
    expect(card).toHaveAttribute("data-motion-animate", "none");
  });

  // -------------------------------------------------------------------------
  // Image status state machine — pins the `loading` -> `loaded` / `error`
  // transitions and the resulting fallback visibility (NEW-8 audit target).
  // The gradient-orb fallback layer is detected the same way the existing
  // "RENDERS GRADIENT ORBS..." tests do: by querying for the caller-supplied
  // `colors.from` class, since that class only exists in the fallback
  // subtree's DOM.
  // -------------------------------------------------------------------------

  it("HIDES THE FALLBACK AND KEEPS THE IMAGE PRESENT AFTER THE IMAGE LOAD EVENT FIRES", () => {
    // Arrange
    const { container } = render(
      <ProjectCard {...DEFAULT_PROPS} image="/test-image.jpg" />
    );
    const img = screen.getByRole("img", { name: "Test project image" });

    // Act
    fireEvent.load(img);

    // Assert
    expect(container.querySelector(".bg-blue-600")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Test project image" })
    ).toBeInTheDocument();
  });

  it("RESTORES THE FALLBACK WHEN A LOADED IMAGE SUBSEQUENTLY FIRES AN ERROR EVENT", () => {
    // Arrange — drive image status to "loaded" first (fallback confirmed
    // hidden) so the assertions below isolate the effect of the error event
    // that follows, rather than a fallback that was merely never dismissed.
    const { container } = render(
      <ProjectCard {...DEFAULT_PROPS} image="/test-image.jpg" />
    );
    const img = screen.getByRole("img", { name: "Test project image" });
    fireEvent.load(img);
    expect(container.querySelector(".bg-blue-600")).not.toBeInTheDocument();

    // Act
    fireEvent.error(img);

    // Assert — the fallback branch reasserts itself; the image element
    // stays mounted (hasImage is still true today), matching current
    // behavior exactly.
    expect(container.querySelector(".bg-blue-600")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Test project image" })
    ).toBeInTheDocument();
  });

  it("RENDERS ONLY THE FALLBACK PLACEHOLDER AND NO IMAGE ELEMENT WHEN NO IMAGE IS PROVIDED", () => {
    // Arrange
    // Act
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);

    // Assert
    expect(container.querySelector(".bg-blue-600")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Interaction-state branches adjacent to the image state machine (also
  // flagged uncovered by the NEW-8 audit): the reduced-motion-off side of
  // the hover animate variant, and both sides of the onBlur focus-containment
  // check. See RISKS in the handback for why these substitute for the
  // nonexistent `showArrow` pin requested for this component.
  // -------------------------------------------------------------------------

  it("APPLIES THE HOVER ANIMATE VARIANT ON THE ACTIVE CARD WHEN REDUCED MOTION IS NOT PREFERRED", () => {
    // Arrange
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);
    const card = container.querySelector(".project-card") as HTMLElement;

    // Act
    fireEvent.focus(card);

    // Assert
    expect(card).toHaveAttribute("data-motion-animate", "hover");
  });

  it("CLEARS THE ACTIVE STATE WHEN BLUR MOVES FOCUS OUTSIDE THE CARD", () => {
    // Arrange
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);
    const card = container.querySelector(".project-card") as HTMLElement;
    fireEvent.focus(card);
    expect(card).toHaveAttribute("data-motion-animate", "hover");

    // Act — relatedTarget is outside the card, so the containment check
    // fails and the blur is honored.
    fireEvent.blur(card, { relatedTarget: document.body });

    // Assert
    expect(card).toHaveAttribute("data-motion-animate", "none");
  });

  it("KEEPS THE ACTIVE STATE WHEN BLUR MOVES FOCUS TO ANOTHER ELEMENT INSIDE THE CARD", () => {
    // Arrange
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);
    const card = container.querySelector(".project-card") as HTMLElement;
    const childLink = screen.getByText("View Case").closest("a") as HTMLElement;
    fireEvent.focus(card);
    expect(card).toHaveAttribute("data-motion-animate", "hover");

    // Act — relatedTarget is a descendant of the card, so the containment
    // check succeeds and the blur is ignored (no active-state flicker while
    // focus moves between focusable children of the same card).
    fireEvent.blur(card, { relatedTarget: childLink });

    // Assert
    expect(card).toHaveAttribute("data-motion-animate", "hover");
  });
});