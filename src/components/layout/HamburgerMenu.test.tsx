import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import messages from "@/messages/en.json";
import { HamburgerMenu } from "./HamburgerMenu";

// ---------------------------------------------------------------------------
// Real framer-motion (no module mock) — AnimatePresence and the variants must
// run for real so the open/submenu/back transitions are genuinely exercised,
// not stubbed away. jsdom has no layout engine, so the restored >=44x44
// Apple HIG hit area is not assertable via geometry (getBoundingClientRect
// stays zeroed); the structural pins below (no `pointer-events-none` gating
// the trigger, an `aria-hidden` `-inset-*` extension span on both buttons)
// are the regression guard instead. useReducedMotion() reads
// `window.matchMedia("(prefers-reduced-motion)")` exactly once per module
// lifetime and caches the result in a module-level ref (motion-dom's
// `prefersReducedMotion` / `hasReducedMotionListener` singleton — confirmed
// by reading the source), updating it only via the "change" listener
// registered on that first read. A matchMedia mock is therefore installed
// below in `beforeAll`, before the first render in this file, seeded
// non-reduced so it changes nothing about this file's other assertions; the
// REDUCED-MOTION test flips `.matches` and fires the stored listener
// immediately before its own render (repo pattern, see Footer.test.tsx /
// useMediaQuery.test.ts), and every test resets it back afterward.
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

function renderMenu() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HamburgerMenu />
    </NextIntlClientProvider>,
  );
}

describe("HamburgerMenu", () => {
  beforeAll(() => {
    installMatchMedia(false);
  });

  afterEach(() => {
    // Reset the shared matchMedia mock so no test's reduced-motion
    // arrangement leaks into the next render (mirrors Footer.test.tsx).
    mockMQL.matches = false;
    mockMQL._listener?.();
  });

  it("EXPOSES A POINTER-EVENTS-ENABLED TRIGGER WITH AN ARIA-HIDDEN HIT-AREA EXTENSION SPAN", () => {
    // Arrange
    // Act
    renderMenu();

    // Assert
    const trigger = screen.getByRole("button", { name: "Open menu" });
    const extensionSpan = trigger.querySelector('span[aria-hidden="true"]');
    expect(trigger.className).not.toContain("pointer-events-none");
    expect(extensionSpan).toBeInTheDocument();
    expect(extensionSpan?.className).toMatch(/-inset-/);
  });

  it("EXPOSES AN ARIA-HIDDEN HIT-AREA EXTENSION SPAN ON THE BACK BUTTON ONCE THE MENU IS OPEN", () => {
    // Arrange
    renderMenu();

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    // Assert
    const backButton = screen.getByRole("button", { name: "Go back" });
    const extensionSpan = backButton.querySelector('span[aria-hidden="true"]');
    expect(extensionSpan).toBeInTheDocument();
    expect(extensionSpan?.className).toMatch(/-inset-/);
  });

  it("OPENS THE MENU WHEN THE TRIGGER'S HIT-AREA EXTENSION SPAN IS CLICKED", () => {
    // Arrange
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Open menu" });
    const extensionSpan = trigger.querySelector('span[aria-hidden="true"]') as HTMLElement;

    // Act
    fireEvent.click(extensionSpan);

    // Assert
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("KEEPS THE TRIGGER A NATIVE BUTTON SO ACTIVATING THE FOCUSED ELEMENT OPENS THE MENU", () => {
    // Arrange — Enter/Space activating a focused element is native <button>
    // behavior; jsdom does not model that keyboard-to-click translation
    // (confirmed directly against jsdom: a bare keydown never dispatches a
    // click). A real, enabled <button> is what makes Enter/Space work in
    // production browsers.
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Open menu" });
    trigger.focus();

    // Act — Enter alone must not open anything via some other path
    fireEvent.keyDown(trigger, { key: "Enter" });

    // Assert — confirms the above: jsdom never turned that into a click
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Act — the click a browser's native activation of a focused button
    // produces
    fireEvent.click(trigger);

    // Assert — real <button> semantics, plus the activation it produced
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).not.toBeDisabled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("MAKES THE BACK BUTTON INTERACTIVE ONLY AFTER A SUBMENU OPENS, AND RETURNS TO THE MAIN LIST", async () => {
    // Arrange
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const backButton = screen.getByRole("button", { name: "Go back" });

    // Assert — no submenu active yet: back button must not intercept clicks
    expect(backButton.style.pointerEvents).toBe("none");

    // Act — open the projects submenu
    fireEvent.click(screen.getByText("Projects"));

    // Assert — pointer-events flips synchronously with activeSubmenu; the
    // submenu content itself mounts only once AnimatePresence (mode="wait")
    // finishes exiting the main list, so that part is awaited.
    expect(backButton.style.pointerEvents).toBe("auto");
    await waitFor(() => expect(screen.getByText("Project 1")).toBeInTheDocument());

    // Act — activate the back button
    fireEvent.click(backButton);

    // Assert — main list restored, submenu content gone
    await waitFor(() => {
      expect(screen.queryByText("Project 1")).not.toBeInTheDocument();
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Wave 2 — regression net: ESC journey, aria-expanded truth, focus
  // management, body scroll lock, reduced-motion functional entry.
  // ---------------------------------------------------------------------------

  it("ESC JOURNEY — A SUBMENU ESCAPE RETURNS TO THE MAIN LIST WITH THE BACK BUTTON INERT AGAIN, AND A SECOND ESCAPE CLOSES THE MENU AND REFOCUSES THE TRIGGER", async () => {
    // Arrange — open the menu, then drill into the projects submenu
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText("Projects"));
    await waitFor(() => expect(screen.getByText("Project 1")).toBeInTheDocument());
    const backButton = screen.getByRole("button", { name: "Go back" });
    expect(backButton.style.pointerEvents).toBe("auto");

    // Act — first Escape: submenu -> main list, menu stays open
    fireEvent.keyDown(document, { key: "Escape" });

    // Assert — main list restored, back button inert again, dialog still open
    await waitFor(() => {
      expect(screen.queryByText("Project 1")).not.toBeInTheDocument();
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(backButton.style.pointerEvents).toBe("none");
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Act — second Escape: main list -> menu closes (180ms timeout), then
    // refocuses the trigger
    fireEvent.keyDown(document, { key: "Escape" });

    // Assert — dialog eventually unmounts once the close transition finishes
    // (the 180ms close timeout plus the outer exit animation), and focus
    // lands back on the trigger
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
      },
      { timeout: 3000 },
    );
  });

  it("ARIA-EXPANDED TRUTH — MIRRORS ISOPEN ACROSS OPEN, SUBMENU NAVIGATION, AND CLOSE", async () => {
    // Arrange
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Open menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Act — open
    fireEvent.click(trigger);

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Act — drill into a submenu
    fireEvent.click(screen.getByText("Projects"));
    await waitFor(() => expect(screen.getByText("Project 1")).toBeInTheDocument());

    // Assert — still true while a submenu is active
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Act — close from the trigger (closeMenu fires regardless of activeSubmenu)
    fireEvent.click(trigger);

    // Assert — flips back to false once the 180ms close timeout runs
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  });

  it("FOCUS ON OPEN — FOCUSES THE TRIGGER AFTER OPENING, THEN THE BACK BUTTON AFTER A SUBMENU OPENS", async () => {
    // Arrange
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Open menu" });

    // Act — open
    fireEvent.click(trigger);

    // Assert — the ~100ms open-focus effect lands on the trigger
    await waitFor(() => expect(trigger).toHaveFocus());

    // Act — drill into a submenu
    fireEvent.click(screen.getByText("Projects"));
    const backButton = screen.getByRole("button", { name: "Go back" });

    // Assert — the ~300ms submenu-focus effect moves focus to the back button
    await waitFor(() => expect(backButton).toHaveFocus());
  });

  it("BODY SCROLL LOCK — LOCKS DOCUMENT.BODY OVERFLOW WHILE OPEN AND RESTORES IT ONCE THE CLOSE TIMEOUT SETTLES ISOPEN", async () => {
    // Arrange
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Open menu" });
    expect(document.body.style.overflow).toBe("");

    // Act — open
    fireEvent.click(trigger);

    // Assert
    expect(document.body.style.overflow).toBe("hidden");

    // Act — close (isOpen itself does not flip until the 180ms close timer fires)
    fireEvent.click(trigger);

    // Assert — still locked immediately after the click; the lock effect only
    // reacts to `isOpen`, not the intermediate `isClosing` state
    expect(document.body.style.overflow).toBe("hidden");

    // Assert — restored once isOpen actually flips back to false
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
  });

  it("REDUCED-MOTION ENTRY — OPENS AND RENDERS THE FULL ITEM LIST WHEN THE OS REPORTS PREFERS-REDUCED-MOTION", () => {
    // Arrange — flip the shared matchMedia mock to "reduced motion on" and
    // fire its stored listener so this fresh mount picks it up (see the
    // matchMedia mock comment above the imports for why a fresh per-test
    // stub alone would never reach framer-motion's cached singleton).
    mockMQL.matches = true;
    mockMQL._listener?.();

    // Act
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    // Assert — dialog opens and every nav item renders; the reduced-motion
    // itemMotion/staggerMotion swap only changes animation values (opacity/
    // x/y/filter/transition), not structure or text content, so this proves
    // the menu stays fully functional under reduced motion without asserting
    // framer internals.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });
});
