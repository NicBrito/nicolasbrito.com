import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import messages from "@/messages/en.json";
import { HamburgerMenu } from "./HamburgerMenu";

// ---------------------------------------------------------------------------
// Real framer-motion (no module mock) — AnimatePresence and the variants must
// run for real so the open/submenu/back transitions are genuinely exercised,
// not stubbed away. jsdom has no layout engine, so the restored >=44x44
// Apple HIG hit area is not assertable via geometry (getBoundingClientRect
// stays zeroed); the structural pins below (no `pointer-events-none` gating
// the trigger, an `aria-hidden` `-inset-*` extension span on both buttons)
// are the regression guard instead. useReducedMotion() degrades to `false`
// when `window.matchMedia` is undefined — jsdom's default — per
// motion-dom's reduced-motion source, so no per-file matchMedia stub is
// needed (setup.ts defines none either).
// ---------------------------------------------------------------------------

function renderMenu() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HamburgerMenu />
    </NextIntlClientProvider>,
  );
}

describe("HamburgerMenu", () => {
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
});
