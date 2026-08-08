import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { SOCIAL_LINKS } from "@/lib/social";
import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt.json";
import { Footer } from "./Footer";

// ---------------------------------------------------------------------------
// next-intl/server mock — Footer is an async Server Component that calls the
// real `getTranslations` from "next-intl/server". Outside an actual Next.js
// request (i.e. under Vitest/jsdom, as here), that specifier resolves via
// next-intl's package.json to its non-RSC "react-client" stub, whose every
// export — including `getTranslations` — unconditionally throws
// "`getTranslations` is not supported in Client Components." (confirmed by
// invoking the real, unmocked `await Footer()` here). We replace it with a
// minimal translator: a per-test `Record<string,string>` namespace lookup
// plus `{token}` interpolation, mirroring the flat translations-map mock
// ProjectCard.test.tsx already uses for the client-side `useTranslations`.
// `activeFooterMessages` resets to null after every test so a test that
// forgets to arrange it fails loudly instead of silently reusing another
// test's catalog.
// ---------------------------------------------------------------------------
const { activeFooterMessages } = vi.hoisted(() => ({
  activeFooterMessages: { current: null as Record<string, string> | null },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => {
    const catalog = activeFooterMessages.current;
    if (namespace !== "Footer" || !catalog) {
      throw new Error(
        "Footer.test.tsx's next-intl/server mock only serves the Footer namespace; " +
          "set activeFooterMessages.current before calling Footer().",
      );
    }

    return (key: string, values?: Record<string, string | number>): string => {
      const template = catalog[key] ?? key;
      if (!values) return template;
      return Object.entries(values).reduce(
        (text, [token, value]) => text.replaceAll(`{${token}}`, String(value)),
        template,
      );
    };
  },
}));

// ---------------------------------------------------------------------------
// window.matchMedia mock — repo-established pattern (see useMediaQuery.test.ts).
// SocialLink's real framer-motion is left unmocked here (its own suite
// already pins the whileHover/whileFocus reduced-motion gating), so its
// `useReducedMotion()` runs for real. That hook lazily reads
// `window.matchMedia("(prefers-reduced-motion)")` exactly once per module
// lifetime and caches the result in a module-level ref, updating it only via
// the "change" listener registered on that first read — confirmed by probing
// the library directly. So the mock is installed once, before any test
// renders, and the REDUCED-MOTION test flips `.matches` and fires the stored
// listener immediately before its own render; a fresh mount then reads the
// updated value regardless of whether it is the first-ever render in this
// file or a later one.
// ---------------------------------------------------------------------------
interface MockMQL {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  _listener: (() => void) | null;
}

let mockMQL: MockMQL;

function installMatchMedia(initialMatches: boolean) {
  mockMQL = {
    matches: initialMatches,
    addEventListener: vi.fn((event: string, cb: () => void) => {
      void event;
      mockMQL._listener = cb;
    }),
    removeEventListener: vi.fn(),
    _listener: null,
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn(() => mockMQL),
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderFooter(locale: "en" | "pt", localeMessages: typeof enMessages) {
  activeFooterMessages.current = localeMessages.Footer;
  // Async-RSC pattern: Footer is an async function component, so its element
  // must be awaited before it can be handed to `render`.
  const footerElement = await Footer();

  return render(
    <NextIntlClientProvider locale={locale} messages={localeMessages}>
      {footerElement}
    </NextIntlClientProvider>,
  );
}

function expectedCopyright(template: string, year: number) {
  return template.replaceAll("{year}", String(year));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Footer", () => {
  beforeAll(() => {
    installMatchMedia(false);
  });

  afterEach(() => {
    // Reset shared mock state so no test's arrangement leaks into the next,
    // regardless of declaration order (mirrors SocialLink.test.tsx's own
    // reduced-motion reset).
    activeFooterMessages.current = null;
    mockMQL.matches = false;
    mockMQL._listener?.();
  });

  it("EXPOSES A CONTENTINFO LANDMARK WITH THE LOCALIZED ACCESSIBLE NAME", async () => {
    // Arrange
    // Act
    await renderFooter("en", enMessages);

    // Assert
    expect(
      screen.getByRole("contentinfo", { name: enMessages.Footer.aria_label }),
    ).toBeInTheDocument();
  });

  it("RENDERS THE COPYRIGHT LINE WITH THE CURRENT YEAR INTERPOLATED FROM THE ICU TEMPLATE", async () => {
    // Arrange
    const year = new Date().getFullYear();

    // Act
    await renderFooter("en", enMessages);

    // Assert
    expect(
      screen.getByText(expectedCopyright(enMessages.Footer.copyright, year)),
    ).toBeInTheDocument();
  });

  it("RENDERS BOTH SOCIAL LINKS FROM THE SHARED SOCIAL_LINKS SOURCE", async () => {
    // Arrange
    // Act
    await renderFooter("en", enMessages);

    // Assert
    const linkedin = screen.getByRole("link", { name: enMessages.Footer.linkedin_label });
    expect(linkedin).toHaveAttribute("href", SOCIAL_LINKS.linkedin);
    expect(linkedin).toHaveAttribute("target", "_blank");
    const linkedinRel = linkedin.getAttribute("rel") ?? "";
    expect(linkedinRel).toContain("noopener");
    expect(linkedinRel).toContain("noreferrer");

    const github = screen.getByRole("link", { name: enMessages.Footer.github_label });
    expect(github).toHaveAttribute("href", SOCIAL_LINKS.github);
    expect(github).toHaveAttribute("target", "_blank");
    const githubRel = github.getAttribute("rel") ?? "";
    expect(githubRel).toContain("noopener");
    expect(githubRel).toContain("noreferrer");
  });

  it("RENDERS THE SAME ACCESSIBLE STRUCTURE WHEN THE REDUCED-MOTION MEDIA QUERY IS ON", async () => {
    // Arrange — flip the shared matchMedia mock to "reduced motion on" and
    // fire its stored listener so the fresh mount below picks it up (see the
    // matchMedia mock comment above for why a plain per-test reinstall would
    // not work against framer-motion's cached singleton).
    mockMQL.matches = true;
    mockMQL._listener?.();
    const year = new Date().getFullYear();

    // Act
    await renderFooter("en", enMessages);

    // Assert — same landmark, both links and the copyright line all present.
    // SocialLink's own suite already pins the whileHover/whileFocus gating;
    // this pin only proves the reduced path renders completely.
    expect(
      screen.getByRole("contentinfo", { name: enMessages.Footer.aria_label }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: enMessages.Footer.linkedin_label }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: enMessages.Footer.github_label }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(expectedCopyright(enMessages.Footer.copyright, year)),
    ).toBeInTheDocument();
  });

  it("RENDERS THE PT CATALOG WITH THE SAME STRUCTURE (LOCALE PARITY SMOKE)", async () => {
    // Arrange
    const year = new Date().getFullYear();

    // Act
    await renderFooter("pt", ptMessages);

    // Assert
    expect(
      screen.getByRole("contentinfo", { name: ptMessages.Footer.aria_label }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(expectedCopyright(ptMessages.Footer.copyright, year)),
    ).toBeInTheDocument();
  });
});
