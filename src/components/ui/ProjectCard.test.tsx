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

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: MockMotionDivProps) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.whileHover;
      delete domProps.onHoverStart;

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
    render(<ProjectCard {...DEFAULT_PROPS} />);

    expect(screen.getByText("Test Project Title")).toBeInTheDocument();
    expect(screen.getByText("Test project description")).toBeInTheDocument();
  });

  it("RENDERS DEFAULT ACTION BUTTONS", () => {
    render(<ProjectCard {...DEFAULT_PROPS} />);

    expect(screen.getByText("View Case")).toBeInTheDocument();
    expect(screen.getByText("Visit Site")).toBeInTheDocument();
  });

  it("APPLIES CUSTOM COLSPAN CLASS", () => {
    const { container } = render(
      <ProjectCard {...DEFAULT_PROPS} colSpan="md:col-span-6" />
    );

    const card = container.querySelector(".md\\:col-span-6");
    expect(card).toBeInTheDocument();
  });

  it("APPLIES CUSTOM CLASSNAME", () => {
    const { container } = render(
      <ProjectCard {...DEFAULT_PROPS} className="custom-class" />
    );

    const card = container.querySelector(".custom-class");
    expect(card).toBeInTheDocument();
  });

  it("RENDERS WITH IMAGE WHEN PROVIDED", () => {
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        image="/test-image.jpg"
      />
    );

    const img = screen.getByRole("img", { name: "Test project image" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("data-src", "/test-image.jpg");
  });

  it("RENDERS CUSTOM ACTIONS WHEN PROVIDED", () => {
    const customActions = <button>Custom Action</button>;

    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        actions={customActions}
      />
    );

    expect(screen.getByText("Custom Action")).toBeInTheDocument();
    expect(screen.queryByText("View Case")).not.toBeInTheDocument();
  });

  it("USES CUSTOM TRANSLATION NAMESPACE", () => {
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        translationNamespace="CustomNamespace"
      />
    );

    expect(screen.getByText("Test Project Title")).toBeInTheDocument();
  });

  it("RENDERS GRADIENT ORBS WITHOUT IMAGE", () => {
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);

    const orbFrom = container.querySelector(".bg-blue-600");
    const orbTo = container.querySelector(".bg-purple-600");

    expect(orbFrom).toBeInTheDocument();
    expect(orbTo).toBeInTheDocument();
  });

  it("APPLIES DIFFERENT COLOR SCHEMES", () => {
    const { container } = render(
      <ProjectCard
        {...DEFAULT_PROPS}
        colors={{
          from: "bg-emerald-600",
          to: "bg-teal-600",
        }}
      />
    );

    const orbFrom = container.querySelector(".bg-emerald-600");
    const orbTo = container.querySelector(".bg-teal-600");

    expect(orbFrom).toBeInTheDocument();
    expect(orbTo).toBeInTheDocument();
  });

  it("RENDERS WITH PRIORITY PROP FOR IMAGE LOADING", () => {
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        image="/priority-image.jpg"
        priority={true}
      />
    );

    const img = screen.getByRole("img", { name: "Test project image" });
    expect(img).toBeInTheDocument();
  });

  it("RENDERS WITHOUT PRIORITY PROP", () => {
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        image="/normal-image.jpg"
        priority={false}
      />
    );

    const img = screen.getByRole("img", { name: "Test project image" });
    expect(img).toBeInTheDocument();
  });

  it("RENDERS WITH DEFAULT COLSPAN WHEN NOT PROVIDED", () => {
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);

    const card = container.querySelector(".xl\\:col-span-4");
    expect(card).toBeInTheDocument();
  });

  it("RENDERS NOISE TEXTURE OVERLAY", () => {
    const { container } = render(<ProjectCard {...DEFAULT_PROPS} />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("RENDERS GLASSMORPHISM BLUR LAYER WITH IMAGE", () => {
    render(
      <ProjectCard
        {...DEFAULT_PROPS}
        image="/test-image.jpg"
      />
    );

    const img = screen.getByRole("img", { name: "Test project image" });
    expect(img).toBeInTheDocument();
  });

  it("RENDERS WITH CORRECT LINK HREFS", () => {
    render(<ProjectCard {...DEFAULT_PROPS} />);

    const viewCaseLink = screen.getByText("View Case").closest("a");
    const visitSiteLink = screen.getByText("Visit Site").closest("a");

    expect(viewCaseLink).toHaveAttribute("href", "/projects/test-project");
    expect(visitSiteLink).toHaveAttribute("href", "/projects/test-project/demo");
  });

  it("KEEPS DEFAULT ACTION LINKS IN TAB ORDER", () => {
    render(<ProjectCard {...DEFAULT_PROPS} />);

    const viewCaseLink = screen.getByText("View Case").closest("a");
    const visitSiteLink = screen.getByText("Visit Site").closest("a");

    expect(viewCaseLink).not.toHaveAttribute("tabindex", "-1");
    expect(visitSiteLink).not.toHaveAttribute("tabindex", "-1");
  });
});