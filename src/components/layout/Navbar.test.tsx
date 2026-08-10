import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import messages from "@/messages/en.json";
import { Navbar } from "./Navbar";

// ---------------------------------------------------------------------------
// Navbar — landmark, hit-area ADR, hover/focus affordance, dropdown disclosure
// and keyboard reachability.
//
// Real framer-motion (no module mock), per the HamburgerMenu.test.tsx
// precedent: AnimatePresence, the disclosure variants and the reduced-motion
// variant swap must run for real to be worth pinning.
//
// HIT-AREA ADR SCOPE (2026-08-07 "Hit-area policy", NEW-2 ACCEPTED) — jsdom
// has no layout or hit-testing engine and never applies class-based CSS, so
// `pointer-events-none` on a padded pill wrapper is NOT enforced in this
// environment: an event dispatched on the padded area still reaches the link.
// The "interactive area == visual bounds" split is therefore pinned on two
// layers:
//   (a) STRUCTURAL — the pill wrapper carries `pointer-events-none` plus the
//       padding/focus-pill classes while the visible label carries
//       `pointer-events-auto`. These class assertions ARE the regression pin
//       for the split.
//   (b) BEHAVIORAL — activation dispatched on the LABEL really activates: the
//       dropdown opens, and a label click reaches the anchor carrying the
//       catalog href.
// Non-activation of the padded pill area is browser-verified only (b92ad03
// review + Front W) and is deliberately not asserted here.
//
// Timing constants mirror Navbar.tsx's private values so a retune fails loudly
// instead of silently changing the interaction.
// ---------------------------------------------------------------------------

// next/navigation mock — `usePathname` is a router-context read that returns
// null outside a Next request, which would leave the "current route" label
// branch unreachable. A controllable stub makes the active-item affordance
// deterministic.
const { mockPathname } = vi.hoisted(() => ({ mockPathname: { current: "/" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.current,
}));

// window.matchMedia mock — repo-established pattern (see useMediaQuery.test.ts
// and Footer.test.tsx). framer-motion's `useReducedMotion` reads
// `window.matchMedia("(prefers-reduced-motion)")` once per module lifetime and
// caches it, refreshing only through the "change" listener it registered on
// that first read. So the mock is installed once, before any render, and the
// reduced-motion test flips `.matches` and fires the stored listener before its
// own mount.
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

// window.scrollTo stub — unimplemented in jsdom and called by framer-motion's
// keyframe measurement as soon as the disclosure animations really run.
//
// The sibling gap is not stubbable: jsdom loads no stylesheet and does not
// inherit custom properties to descendants (verified directly), so the navbar
// fill's `backgroundColor: var(--background)` target cannot resolve here and
// motion logs a "not an animatable value" notice. In a browser the token
// resolves from globals.css `:root`, so that notice is an environment artifact,
// not a defect — and no assertion in this file depends on the fill color.
function installJsdomMotionEnvironment() {
  Object.defineProperty(window, "scrollTo", {
    writable: true,
    configurable: true,
    value: vi.fn(),
  });
}

// --- Mirrored source constants (Navbar.tsx) --------------------------------
/** `openMenu` hover-intent delay before a closed menu opens. */
const HOVER_OPEN_DELAY_MS = 250;
/** Delay before the Tab handlers hand focus to the next target. */
const FOCUS_HANDOFF_DELAY_MS = 100;
/** Delay before the navbar fill fades back out after the menu closes. */
const NAV_FILL_HIDE_DELAY_MS = 850;

// --- Mirrored structural contract (Navbar.tsx) ------------------------------
/** Padded pill around a nav item: keeps the box + focus ring, takes no pointer. */
const NAV_PILL_TOKENS = [
  "py-1.5",
  "px-2",
  "sm:px-3",
  "-mx-2",
  "sm:-mx-3",
  "rounded-full",
  "outline-none",
  "focus:bg-white/20",
  "focus-visible:bg-white/20",
  "pointer-events-none",
] as const;

/** Padded pill around a dropdown/explore label — same policy, tighter padding. */
const DROPDOWN_PILL_TOKENS = [
  "py-1",
  "px-2",
  "-mx-2",
  "rounded-full",
  "outline-none",
  "focus:bg-white/20",
  "focus-visible:bg-white/20",
  "pointer-events-none",
] as const;

// --- Mirrored nav configuration (Navbar.tsx NAV_ITEMS / MENU_CONFIG) --------
const NAV_KEYS = ["home", "projects", "games", "blog"] as const;
type NavKey = (typeof NAV_KEYS)[number];

const NAV_LABEL: Record<NavKey, string> = {
  home: messages.Navbar.home,
  projects: messages.Navbar.projects,
  games: messages.Navbar.games,
  blog: messages.Navbar.blog,
};

const NAV_HREF: Record<NavKey, string> = {
  home: "/",
  projects: "/projects",
  games: "/games",
  blog: "/blog",
};

const PROJECTS_MENU = {
  href: "/projects",
  exploreTitle: messages.Navbar.headers.explore_projects,
  exploreAction: messages.Navbar.actions.explore_all_projects,
  selectedTitle: messages.Navbar.headers.selected_projects,
  items: [
    messages.Navbar.menu.project_1,
    messages.Navbar.menu.project_2,
    messages.Navbar.menu.project_3,
    messages.Navbar.menu.project_4,
    messages.Navbar.menu.project_5,
  ],
};

const GAMES_MENU = {
  href: "/games",
  exploreAction: messages.Navbar.actions.explore_all_games,
  items: [
    messages.Navbar.menu.game_1,
    messages.Navbar.menu.game_2,
    messages.Navbar.menu.game_3,
    messages.Navbar.menu.game_4,
    messages.Navbar.menu.game_5,
  ],
};

const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

// --- Helpers ---------------------------------------------------------------

function renderNavbar(pageContent?: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Navbar />
      {pageContent}
    </NextIntlClientProvider>,
  );
}

function getNav() {
  return screen.getByRole("navigation", { name: messages.Navbar.aria_label });
}

function navLinks(nav: HTMLElement) {
  return Array.from(nav.querySelectorAll<HTMLAnchorElement>("a[data-nav-item]"));
}

/** Explore link first, then the five menu entries — DOM order. */
function dropdownLinks(nav: HTMLElement) {
  return Array.from(nav.querySelectorAll<HTMLAnchorElement>("a[data-dropdown-item]"));
}

function getNavLink(nav: HTMLElement, key: NavKey) {
  return navLinks(nav)[NAV_KEYS.indexOf(key)];
}

/** The visible label inside a pill wrapper — the only pointer target. */
function labelOf(pill: HTMLElement) {
  return pill.firstElementChild as HTMLElement;
}

function classesOf(element: Element) {
  return Array.from(element.classList);
}

function focusablesIn(nav: HTMLElement) {
  return Array.from(nav.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function accessibleTextOf(element: HTMLElement) {
  return element.getAttribute("aria-label") ?? element.textContent ?? "";
}

/** Hover-opens a dropdown. Requires fake timers. */
function hoverOpen(nav: HTMLElement, key: "projects" | "games") {
  fireEvent.mouseEnter(labelOf(getNavLink(nav, key)));
  act(() => {
    vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS);
  });
}

/** Flushes the `isNavbarVisible` fill timer. Requires fake timers. */
function flushFillTimer(ms = 0) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

// --- Tests -----------------------------------------------------------------

describe("Navbar", () => {
  beforeAll(() => {
    installMatchMedia(false);
    installJsdomMotionEnvironment();
  });

  afterEach(() => {
    // Leave no fake clock or mock state behind for the next test.
    vi.useRealTimers();
    mockMQL.matches = false;
    mockMQL._listener?.();
    mockPathname.current = "/";
  });

  describe("landmark and localized copy", () => {
    it("EXPOSES THE NAVIGATION LANDMARK WITH THE LOCALIZED ACCESSIBLE NAME", () => {
      // Arrange
      // Act
      renderNavbar();

      // Assert
      expect(
        screen.getByRole("navigation", { name: messages.Navbar.aria_label }),
      ).toBeInTheDocument();
    });

    it("RENDERS EVERY NAV ITEM FROM THE CATALOG, IN CONFIGURATION ORDER, WITH ITS HREF", () => {
      // Arrange
      renderNavbar();

      // Act
      const links = navLinks(getNav());

      // Assert
      expect(links).toHaveLength(NAV_KEYS.length);
      NAV_KEYS.forEach((key, index) => {
        expect(links[index].textContent).toBe(NAV_LABEL[key]);
        expect(links[index]).toHaveAttribute("href", NAV_HREF[key]);
      });
    });

    it("ADVERTISES A POPUP ONLY ON THE TWO ITEMS THAT OWN A DROPDOWN", () => {
      // Arrange
      renderNavbar();
      const nav = getNav();

      // Act
      const haspopup = NAV_KEYS.map((key) =>
        getNavLink(nav, key).getAttribute("aria-haspopup"),
      );

      // Assert
      expect(haspopup).toEqual([null, "menu", "menu", null]);
      NAV_KEYS.forEach((key) => {
        expect(getNavLink(nav, key)).not.toHaveAttribute("aria-expanded");
      });
    });
  });

  describe("hit-area ADR — pointer-events split", () => {
    it("KEEPS EVERY NAV PILL WRAPPER POINTER-INERT WHILE ITS LABEL TAKES POINTER EVENTS", () => {
      // Arrange
      renderNavbar();
      const nav = getNav();

      // Act
      const pills = navLinks(nav);

      // Assert — structural pin (a): padded box + focus pill on the wrapper,
      // pointer target on the visible label only.
      pills.forEach((pill) => {
        const wrapperClasses = classesOf(pill);
        NAV_PILL_TOKENS.forEach((token) => expect(wrapperClasses).toContain(token));

        const labelClasses = classesOf(labelOf(pill));
        expect(labelClasses).toContain("pointer-events-auto");
        expect(labelClasses).not.toContain("pointer-events-none");
      });
    });

    it("KEEPS EVERY DROPDOWN AND EXPLORE PILL WRAPPER POINTER-INERT WHILE ITS LABEL TAKES POINTER EVENTS", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();

      // Act
      hoverOpen(nav, "projects");
      const pills = dropdownLinks(nav);

      // Assert
      expect(pills).toHaveLength(1 + PROJECTS_MENU.items.length);
      pills.forEach((pill) => {
        const wrapperClasses = classesOf(pill);
        DROPDOWN_PILL_TOKENS.forEach((token) => expect(wrapperClasses).toContain(token));

        const labelClasses = classesOf(labelOf(pill));
        expect(labelClasses).toContain("pointer-events-auto");
        expect(labelClasses).not.toContain("pointer-events-none");
      });
    });

    it("ACTIVATES THE NAV LINK WHEN THE CLICK LANDS ON THE LABEL", () => {
      // Arrange — behavioral pin (b): the label is the pointer target, and its
      // activation must reach the anchor that carries the route. The listener
      // also cancels the default so jsdom does not attempt the (unimplemented)
      // navigation it would otherwise queue on a timer.
      renderNavbar();
      const nav = getNav();

      NAV_KEYS.forEach((key) => {
        const pill = getNavLink(nav, key);
        const activations = vi.fn((event: Event) => event.preventDefault());
        pill.addEventListener("click", activations);

        // Act
        fireEvent.click(labelOf(pill));

        // Assert
        expect(activations).toHaveBeenCalledTimes(1);
        expect(labelOf(pill).closest("a")).toBe(pill);
        expect(pill).toHaveAttribute("href", NAV_HREF[key]);
      });
    });

    it("ACTIVATES A DROPDOWN ENTRY WHEN THE CLICK LANDS ON ITS LABEL", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");

      dropdownLinks(nav).forEach((pill) => {
        const activations = vi.fn((event: Event) => event.preventDefault());
        pill.addEventListener("click", activations);

        // Act
        fireEvent.click(labelOf(pill));

        // Assert
        expect(activations).toHaveBeenCalledTimes(1);
        expect(pill).toHaveAttribute("href", PROJECTS_MENU.href);
      });
    });

    it("OPENS THE DROPDOWN WHEN THE POINTER ENTERS THE LABEL, NOT THE PILL WRAPPER", () => {
      // Arrange — the hover handler lives on the label, which is the whole
      // point of the split: the padded area carries no interaction.
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      const projects = getNavLink(nav, "projects");

      // Act
      fireEvent.mouseEnter(labelOf(projects));
      act(() => {
        vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS);
      });

      // Assert
      expect(projects).toHaveAttribute("aria-expanded", "true");
      expect(dropdownLinks(nav).map((link) => link.textContent)).toEqual([
        PROJECTS_MENU.exploreAction,
        ...PROJECTS_MENU.items,
      ]);
    });
  });

  describe("hover intent and focus affordance", () => {
    it("HOLDS THE DROPDOWN CLOSED UNTIL THE FULL HOVER-INTENT DELAY HAS ELAPSED", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      const projects = getNavLink(nav, "projects");

      // Act — one millisecond short of the mirrored delay
      fireEvent.mouseEnter(labelOf(projects));
      act(() => {
        vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS - 1);
      });

      // Assert
      expect(dropdownLinks(nav)).toHaveLength(0);
      expect(projects).not.toHaveAttribute("aria-expanded");

      // Act — the final millisecond
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Assert
      expect(dropdownLinks(nav)).toHaveLength(1 + PROJECTS_MENU.items.length);
      expect(projects).toHaveAttribute("aria-expanded", "true");
    });

    it("SWAPS STRAIGHT TO THE NEXT MENU, WITHOUT RE-ARMING THE DELAY, WHILE ONE IS ALREADY OPEN", async () => {
      // Arrange — real timers, because the swap's MorphingLabel cross-fade has
      // to settle before the copy can be compared.
      renderNavbar();
      const nav = getNav();
      fireEvent.mouseEnter(labelOf(getNavLink(nav, "projects")));
      await waitFor(
        () => expect(dropdownLinks(nav)).toHaveLength(1 + PROJECTS_MENU.items.length),
        { timeout: 3000 },
      );

      // Act — no wait at all this time
      fireEvent.mouseEnter(labelOf(getNavLink(nav, "games")));

      // Assert — the swap lands on the same tick, with no hover-intent delay
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");
      expect(getNavLink(nav, "games")).toHaveAttribute("aria-expanded", "true");
      dropdownLinks(nav).forEach((link) =>
        expect(link).toHaveAttribute("href", GAMES_MENU.href),
      );

      // Assert — and the morphing labels settle on the games copy. Mid-morph
      // the outgoing and incoming characters are mounted together, so this is
      // the settled state, not the transitional one.
      await waitFor(
        () =>
          expect(dropdownLinks(nav).map((link) => link.textContent)).toEqual([
            GAMES_MENU.exploreAction,
            ...GAMES_MENU.items,
          ]),
        { timeout: 3000 },
      );
    });

    it("RE-ARMS THE FULL DELAY WHEN THE POINTER CROSSES TO ANOTHER CLOSED DROPDOWN", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();

      // Act — leave Projects one millisecond early, land on Games
      fireEvent.mouseEnter(labelOf(getNavLink(nav, "projects")));
      act(() => {
        vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS - 1);
      });
      fireEvent.mouseEnter(labelOf(getNavLink(nav, "games")));
      act(() => {
        vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS - 1);
      });

      // Assert — Projects' original deadline has long passed and still opened
      // nothing: crossing over discarded it rather than inheriting it
      expect(dropdownLinks(nav)).toHaveLength(0);
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");
      expect(getNavLink(nav, "games")).not.toHaveAttribute("aria-expanded");

      // Act — the final millisecond of the re-armed delay
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Assert
      expect(getNavLink(nav, "games")).toHaveAttribute("aria-expanded", "true");
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");
    });

    it("CLEARS THE ARMED HOVER TIMER WHEN THE NAVBAR UNMOUNTS", () => {
      // Arrange
      vi.useFakeTimers();
      const { unmount } = renderNavbar();
      const nav = getNav();
      const pendingBeforeHover = vi.getTimerCount();

      // Act
      fireEvent.mouseEnter(labelOf(getNavLink(nav, "projects")));

      // Assert — the hover intent is a live timer
      expect(vi.getTimerCount()).toBe(pendingBeforeHover + 1);

      // Act
      unmount();

      // Assert — nothing survives the teardown to fire into a dead tree
      expect(vi.getTimerCount()).toBe(0);
    });

    it("CANCELS AN ARMED HOVER INTENT WHEN THE POINTER MOVES TO AN ITEM WITHOUT A DROPDOWN", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();

      // Act — arm on Projects, then bail out onto Home before it fires
      fireEvent.mouseEnter(labelOf(getNavLink(nav, "projects")));
      act(() => {
        vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS - 1);
      });
      fireEvent.mouseEnter(labelOf(getNavLink(nav, "home")));
      act(() => {
        vi.advanceTimersByTime(HOVER_OPEN_DELAY_MS);
      });

      // Assert
      expect(dropdownLinks(nav)).toHaveLength(0);
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");
    });

    it("BRIGHTENS THE FOCUSED NAV LABEL WITHOUT OPENING ITS DROPDOWN", () => {
      // Arrange — focus alone is not a disclosure trigger in this component;
      // only hover and the Tab handler open a menu.
      renderNavbar();
      const nav = getNav();
      const projects = getNavLink(nav, "projects");

      // Act
      act(() => {
        projects.focus();
      });

      // Assert — focus pill classes stay on the wrapper, label goes full opacity
      expect(classesOf(projects)).toEqual(
        expect.arrayContaining(["focus:bg-white/20", "focus-visible:bg-white/20"]),
      );
      expect(classesOf(labelOf(projects))).toContain("text-white");
      expect(classesOf(labelOf(projects))).not.toContain("text-white/70");
      expect(dropdownLinks(nav)).toHaveLength(0);
      expect(projects).not.toHaveAttribute("aria-expanded");
    });

    it("MARKS THE CURRENT ROUTE'S LABEL AS ACTIVE AND DIMS THE OTHERS", () => {
      // Arrange
      mockPathname.current = NAV_HREF.blog;

      // Act
      renderNavbar();
      const nav = getNav();

      // Assert
      expect(classesOf(labelOf(getNavLink(nav, "blog")))).toContain("text-white");
      expect(classesOf(labelOf(getNavLink(nav, "home")))).toContain("text-white/70");
    });

    it("HOLDS THE NAVBAR FILL FOR THE FULL HIDE DELAY AFTER THE MENU CLOSES", () => {
      // Arrange — the fill drives which palette the labels use.
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      flushFillTimer();
      expect(classesOf(labelOf(getNavLink(nav, "projects")))).toContain("text-foreground");

      // Act — close, then stop one millisecond short of the hide delay
      fireEvent.mouseLeave(nav);
      act(() => {
        vi.advanceTimersByTime(NAV_FILL_HIDE_DELAY_MS - 1);
      });

      // Assert — still on the filled-navbar palette
      expect(classesOf(labelOf(getNavLink(nav, "projects")))).toContain("text-foreground/70");

      // Act — the final millisecond
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Assert — back to the transparent-navbar palette
      expect(classesOf(labelOf(getNavLink(nav, "projects")))).toContain("text-white/70");
    });
  });

  describe("dropdown disclosure", () => {
    it("RENDERS BOTH COLUMN HEADERS AND THE EXPLORE LINK WHEN A MENU OPENS", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();

      // Act
      hoverOpen(nav, "projects");

      // Assert — MorphingLabel splits copy into per-character spans, so the
      // catalog strings are matched on the container's textContent.
      expect(nav.textContent).toContain(PROJECTS_MENU.exploreTitle);
      expect(nav.textContent).toContain(PROJECTS_MENU.selectedTitle);
      expect(dropdownLinks(nav)[0]).toHaveAttribute("href", PROJECTS_MENU.href);
      expect(dropdownLinks(nav)[0].textContent).toBe(PROJECTS_MENU.exploreAction);
    });

    it("CLOSES THE MENU WHEN THE POINTER LEAVES THE NAV WITH NOTHING FOCUSED", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");

      // Act
      fireEvent.mouseLeave(nav);

      // Assert — the disclosure state flips synchronously; the DOM removal
      // waits on the exit animation (pinned in the real-timer test below).
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");
    });

    it("KEEPS THE MENU OPEN WHEN THE POINTER LEAVES WHILE A NAV ITEM STILL HAS FOCUS", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      const projects = getNavLink(nav, "projects");
      act(() => {
        projects.focus();
      });
      hoverOpen(nav, "projects");

      // Act
      fireEvent.mouseLeave(nav);

      // Assert
      expect(projects).toHaveAttribute("aria-expanded", "true");
      expect(dropdownLinks(nav)).toHaveLength(1 + PROJECTS_MENU.items.length);
    });

    it("CLOSES WHEN FOCUS ESCAPES THE PANEL FROM THE EXPLORE LINK", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const explore = dropdownLinks(nav)[0];
      act(() => {
        explore.focus();
      });

      // Act
      fireEvent.blur(explore, { relatedTarget: null });

      // Assert
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");
    });

    it("CLOSES WHEN FOCUS ESCAPES THE PANEL FROM AN ENTRY, BUT SURVIVES FOCUS MOVING BETWEEN ENTRIES", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const [, firstItem, secondItem] = dropdownLinks(nav);
      act(() => {
        firstItem.focus();
      });

      // Act — focus travels to the neighbouring entry
      fireEvent.blur(firstItem, { relatedTarget: secondItem });

      // Assert
      expect(getNavLink(nav, "projects")).toHaveAttribute("aria-expanded", "true");

      // Act — focus leaves the navbar entirely
      fireEvent.blur(secondItem, { relatedTarget: null });

      // Assert
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");
    });

    it("REMOVES THE DROPDOWN ENTRIES FROM THE DOM ONCE THE EXIT ANIMATION FINISHES", async () => {
      // Arrange — real timers: the exit is driven by framer-motion's rAF loop,
      // not by a component timeout.
      renderNavbar();
      const nav = getNav();
      fireEvent.mouseEnter(labelOf(getNavLink(nav, "projects")));
      await waitFor(() =>
        expect(dropdownLinks(nav)).toHaveLength(1 + PROJECTS_MENU.items.length),
      );

      // Act
      fireEvent.mouseLeave(nav);

      // Assert
      await waitFor(() => expect(dropdownLinks(nav)).toHaveLength(0), { timeout: 3000 });
      expect(nav.textContent).not.toContain(PROJECTS_MENU.exploreAction);
    });
  });

  describe("keyboard paths", () => {
    it("OPENS THE MENU AND HANDS FOCUS TO THE EXPLORE LINK ON TAB FROM A NAV ITEM THAT OWNS ONE", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      const projects = getNavLink(nav, "projects");
      act(() => {
        projects.focus();
      });

      // Act
      const notPrevented = fireEvent.keyDown(projects, { key: "Tab" });

      // Assert — default Tab is swallowed and replaced by the scripted handoff
      expect(notPrevented).toBe(false);
      expect(projects).toHaveAttribute("aria-expanded", "true");

      // Act
      act(() => {
        vi.advanceTimersByTime(FOCUS_HANDOFF_DELAY_MS);
      });

      // Assert
      expect(document.activeElement).toBe(dropdownLinks(nav)[0]);
    });

    it("WALKS EXPLORE -> FIRST ENTRY ON TAB AND EXPLORE -> NAV ITEM ON SHIFT+TAB", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const [explore, firstItem] = dropdownLinks(nav);
      act(() => {
        explore.focus();
      });

      // Act
      const tabPrevented = fireEvent.keyDown(explore, { key: "Tab" });

      // Assert
      expect(tabPrevented).toBe(false);
      expect(document.activeElement).toBe(firstItem);

      // Act
      act(() => {
        explore.focus();
      });
      const shiftTabPrevented = fireEvent.keyDown(explore, { key: "Tab", shiftKey: true });

      // Assert
      expect(shiftTabPrevented).toBe(false);
      expect(document.activeElement).toBe(getNavLink(nav, "projects"));
    });

    it("RETURNS FROM THE FIRST ENTRY TO THE EXPLORE LINK ON SHIFT+TAB", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const [explore, firstItem] = dropdownLinks(nav);
      act(() => {
        firstItem.focus();
      });

      // Act
      const notPrevented = fireEvent.keyDown(firstItem, { key: "Tab", shiftKey: true });

      // Assert
      expect(notPrevented).toBe(false);
      expect(document.activeElement).toBe(explore);
    });

    it("LEAVES THE MENU AND FOCUSES THE NEXT NAV ITEM ON TAB FROM THE LAST ENTRY", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const entries = dropdownLinks(nav);
      const lastItem = entries[entries.length - 1];
      act(() => {
        lastItem.focus();
      });

      // Act
      const notPrevented = fireEvent.keyDown(lastItem, { key: "Tab" });

      // Assert
      expect(notPrevented).toBe(false);
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");

      // Act
      act(() => {
        vi.advanceTimersByTime(FOCUS_HANDOFF_DELAY_MS);
      });

      // Assert
      expect(document.activeElement).toBe(getNavLink(nav, "games"));
    });

    it("CLOSES ON ESCAPE FROM A DROPDOWN ENTRY AND RETURNS FOCUS TO THE OWNING NAV ITEM", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const firstItem = dropdownLinks(nav)[1];
      act(() => {
        firstItem.focus();
      });

      // Act
      const notPrevented = fireEvent.keyDown(firstItem, { key: "Escape" });

      // Assert
      expect(notPrevented).toBe(false);
      expect(document.activeElement).toBe(getNavLink(nav, "projects"));
      expect(getNavLink(nav, "projects")).not.toHaveAttribute("aria-expanded");
    });

    it("CLOSES ON ESCAPE FROM THE EXPLORE LINK AND RETURNS FOCUS TO THE OWNING NAV ITEM", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "games");
      const explore = dropdownLinks(nav)[0];
      act(() => {
        explore.focus();
      });

      // Act
      const notPrevented = fireEvent.keyDown(explore, { key: "Escape" });

      // Assert
      expect(notPrevented).toBe(false);
      expect(document.activeElement).toBe(getNavLink(nav, "games"));
      expect(getNavLink(nav, "games")).not.toHaveAttribute("aria-expanded");
    });

    it("LATCHES ESCAPE SO THE VERY NEXT TAB LEAVES THE ITEM INSTEAD OF REOPENING THE MENU", () => {
      // Arrange — Escape from inside the menu records the item it dismissed.
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const projects = getNavLink(nav, "projects");
      fireEvent.keyDown(dropdownLinks(nav)[1], { key: "Escape" });

      // Act — first Tab after the dismissal
      const firstTabPrevented = fireEvent.keyDown(projects, { key: "Tab" });
      act(() => {
        vi.advanceTimersByTime(FOCUS_HANDOFF_DELAY_MS);
      });

      // Assert — native Tab is allowed through, the menu stays closed. The
      // disclosure state is read from `aria-expanded`: the entries themselves
      // only leave the DOM once the rAF-driven exit finishes, which a fake
      // clock cannot advance (pinned separately under real timers).
      expect(firstTabPrevented).toBe(true);
      expect(projects).not.toHaveAttribute("aria-expanded");

      // Act — the latch is spent, so the following Tab opens again
      const secondTabPrevented = fireEvent.keyDown(projects, { key: "Tab" });

      // Assert
      expect(secondTabPrevented).toBe(false);
      expect(projects).toHaveAttribute("aria-expanded", "true");
    });

    it("SCOPES THE ESCAPE LATCH TO THE DISMISSED ITEM, DROPPING IT WHEN ANOTHER ITEM TAKES FOCUS", () => {
      // Arrange — dismiss Projects with Escape, which latches it
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const projects = getNavLink(nav, "projects");
      fireEvent.keyDown(dropdownLinks(nav)[1], { key: "Escape" });

      // Act — focus a different nav item, then come back
      act(() => {
        getNavLink(nav, "games").focus();
      });
      act(() => {
        projects.focus();
      });
      const notPrevented = fireEvent.keyDown(projects, { key: "Tab" });

      // Assert — the latch belonged to that one visit, so Tab opens again
      expect(notPrevented).toBe(false);
      expect(projects).toHaveAttribute("aria-expanded", "true");
    });

    it("CLOSES THE OPEN MENU ON SHIFT+TAB FROM ITS NAV ITEM", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const projects = getNavLink(nav, "projects");
      act(() => {
        projects.focus();
      });

      // Act
      const notPrevented = fireEvent.keyDown(projects, { key: "Tab", shiftKey: true });

      // Assert — backwards travel must not walk into the panel it just passed
      expect(notPrevented).toBe(false);
      expect(projects).not.toHaveAttribute("aria-expanded");
    });

    it("RELEASES THE FOCUS AFFORDANCE ON SHIFT+TAB OFF THE FIRST NAV ITEM WITHOUT SWALLOWING THE KEY", () => {
      // Arrange — a non-current route, so the label's dimming is observable
      mockPathname.current = NAV_HREF.blog;
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      const home = getNavLink(nav, "home");
      act(() => {
        home.focus();
      });
      expect(classesOf(labelOf(home))).toContain("text-white");

      // Act
      const notPrevented = fireEvent.keyDown(home, { key: "Tab", shiftKey: true });

      // Assert — focus leaves the navbar natively, the label returns to rest
      expect(notPrevented).toBe(true);
      expect(classesOf(labelOf(home))).toContain("text-white/70");
    });

    it("CLOSES THE MENU ON ESCAPE FROM THE NAV ITEM ITSELF", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      hoverOpen(nav, "projects");
      const projects = getNavLink(nav, "projects");
      act(() => {
        projects.focus();
      });

      // Act
      const notPrevented = fireEvent.keyDown(projects, { key: "Escape" });

      // Assert
      expect(notPrevented).toBe(false);
      expect(projects).not.toHaveAttribute("aria-expanded");
      expect(classesOf(labelOf(projects))).not.toContain("text-white");
    });

    it("HANDS FOCUS OUT OF THE NAVBAR ON TAB FROM THE LAST NAV ITEM", () => {
      // Arrange — the handler picks the first focusable below the navbar; jsdom
      // zeroes every rect, so the geometric ordering itself is browser-verified
      // and what is pinned here is the handoff out of the nav.
      vi.useFakeTimers();
      renderNavbar(
        <button type="button" data-testid="page-content">
          Page content
        </button>,
      );
      const nav = getNav();
      hoverOpen(nav, "games");
      const blog = getNavLink(nav, "blog");
      act(() => {
        blog.focus();
      });

      // Act
      const notPrevented = fireEvent.keyDown(blog, { key: "Tab" });

      // Assert
      expect(notPrevented).toBe(false);
      expect(getNavLink(nav, "games")).not.toHaveAttribute("aria-expanded");

      // Act
      act(() => {
        vi.advanceTimersByTime(0);
      });

      // Assert
      expect(document.activeElement).toBe(screen.getByTestId("page-content"));
    });

    it("LEAVES ENTER, SPACE AND ARROW KEYS TO NATIVE LINK BEHAVIOR", () => {
      // Arrange — the component installs no Enter/Space/Arrow handling: the nav
      // items are real anchors, so Enter is the browser's own activation and
      // there is no APG menu keyboard model here (see the suite report).
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      const projects = getNavLink(nav, "projects");
      act(() => {
        projects.focus();
      });

      // Act / Assert
      ["Enter", " ", "ArrowDown", "ArrowUp"].forEach((key) => {
        expect(fireEvent.keyDown(projects, { key })).toBe(true);
        expect(projects).not.toHaveAttribute("aria-expanded");
        expect(dropdownLinks(nav)).toHaveLength(0);
      });
    });

    it("CLOSES THE MENU WHEN FOCUS LEAVES THE NAVBAR, BUT KEEPS IT WHILE FOCUS MOVES INSIDE", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();
      const projects = getNavLink(nav, "projects");
      act(() => {
        projects.focus();
      });
      hoverOpen(nav, "projects");

      // Act — focus moves to another element inside the navbar
      fireEvent.blur(projects, { relatedTarget: getNavLink(nav, "games") });

      // Assert
      expect(projects).toHaveAttribute("aria-expanded", "true");

      // Act — focus leaves the navbar entirely
      fireEvent.blur(projects, { relatedTarget: null });

      // Assert
      expect(projects).not.toHaveAttribute("aria-expanded");
    });
  });

  describe("keyboard reachability", () => {
    it("KEEPS EVERY CLOSED-STATE CONTROL FOCUSABLE IN DOM ORDER", () => {
      // Arrange
      renderNavbar();
      const nav = getNav();

      // Act
      const focusables = focusablesIn(nav);

      // Assert — nav items in configuration order, then the hamburger trigger
      expect(focusables.map(accessibleTextOf)).toEqual([
        ...NAV_KEYS.map((key) => NAV_LABEL[key]),
        messages.Navbar.hamburger.open,
      ]);
      focusables.forEach((element) => {
        expect(element.getAttribute("tabindex")).not.toBe("-1");
        act(() => {
          element.focus();
        });
        expect(document.activeElement).toBe(element);
      });
    });

    it("APPENDS THE EXPLORE LINK AND EVERY DROPDOWN ENTRY TO THE FOCUS ORDER WHEN A MENU OPENS", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();

      // Act
      hoverOpen(nav, "projects");
      const focusables = focusablesIn(nav);

      // Assert
      expect(focusables.map(accessibleTextOf)).toEqual([
        ...NAV_KEYS.map((key) => NAV_LABEL[key]),
        messages.Navbar.hamburger.open,
        PROJECTS_MENU.exploreAction,
        ...PROJECTS_MENU.items,
      ]);
      [...navLinks(nav), ...dropdownLinks(nav)].forEach((link) => {
        expect(link).toHaveAttribute("tabindex", "0");
        act(() => {
          link.focus();
        });
        expect(document.activeElement).toBe(link);
      });
    });
  });

  describe("reduced motion", () => {
    it("DROPS THE BLUR AND THE SLIDE FROM THE DISCLOSURE WHILE STILL RENDERING EVERY ENTRY", () => {
      // Arrange — flip the shared matchMedia mock and notify framer-motion's
      // cached listener before mounting (see the mock comment above).
      mockMQL.matches = true;
      mockMQL._listener?.();
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();

      // Act
      hoverOpen(nav, "projects");
      const entryWrapper = dropdownLinks(nav)[1].parentElement as HTMLElement;

      // Assert — the resting/entry style carries no blur and no y-offset, and
      // the nav itself drops its entry slide.
      expect(entryWrapper.style.filter).toBe("blur(0px)");
      expect(entryWrapper.style.transform).toBe("none");
      expect(nav.style.transform).toBe("none");
      expect(dropdownLinks(nav).map((link) => link.textContent)).toEqual([
        PROJECTS_MENU.exploreAction,
        ...PROJECTS_MENU.items,
      ]);
    });

    it("KEEPS THE BLUR AND SLIDE IN THE DISCLOSURE WHEN REDUCED MOTION IS OFF", () => {
      // Arrange
      vi.useFakeTimers();
      renderNavbar();
      const nav = getNav();

      // Act
      hoverOpen(nav, "projects");
      const entryWrapper = dropdownLinks(nav)[1].parentElement as HTMLElement;

      // Assert — mirrors the `contentItem.hidden` variant in Navbar.tsx; read
      // synchronously, before framer-motion's rAF loop can advance it.
      expect(entryWrapper.style.filter).toBe("blur(4px)");
      expect(entryWrapper.style.transform).toBe("translateY(-8px)");
    });
  });
});
