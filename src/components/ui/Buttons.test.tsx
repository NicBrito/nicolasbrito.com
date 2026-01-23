import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

describe("PrimaryButton", () => {
  it("RENDERS TEXT CONTENT", () => {
    render(<PrimaryButton>Click me</PrimaryButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("RENDERS <A> TAG WHEN HREF PROVIDED", () => {
    render(<PrimaryButton href="/test">Link Button</PrimaryButton>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/test");
  });

  it("RENDERS <BUTTON> TAG WHEN NO HREF", () => {
    render(<PrimaryButton>Click Button</PrimaryButton>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("APPLIES PRIMARY BUTTON CLASSES", () => {
    const { container } = render(<PrimaryButton>Test</PrimaryButton>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-accent");
    expect(button).toHaveClass("text-white");
  });

  it("OPENS LINK IN NEW TAB WITH TARGET _BLANK", () => {
    render(<PrimaryButton href="/test">Link</PrimaryButton>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("HANDLES DOWNLOAD ATTRIBUTE", () => {
    render(
      <PrimaryButton href="/file.pdf" download="filename.pdf">
        Download
      </PrimaryButton>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("download", "filename.pdf");
  });

  it("SHOWS ARROW WHEN SHOWARROW PROP IS TRUE", () => {
    const { container } = render(
      <PrimaryButton showArrow>Click me</PrimaryButton>
    );
    const arrow = container.querySelector("span");
    expect(arrow?.textContent).toBe("→");
  });

  it("DISABLES BUTTON WHEN DISABLED PROP IS TRUE", () => {
    render(<PrimaryButton disabled>Disabled</PrimaryButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("ACCEPTS CUSTOM CLASSNAME", () => {
    const { container } = render(
      <PrimaryButton className="custom-class">Test</PrimaryButton>
    );
    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });
});

describe("SecondaryButton", () => {
  it("RENDERS TEXT CONTENT", () => {
    render(<SecondaryButton>Click me</SecondaryButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("RENDERS <A> TAG WHEN HREF PROVIDED", () => {
    render(<SecondaryButton href="/test">Link Button</SecondaryButton>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/test");
  });

  it("RENDERS <BUTTON> TAG WHEN NO HREF", () => {
    render(<SecondaryButton>Click Button</SecondaryButton>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("APPLIES SECONDARY BUTTON CLASSES", () => {
    const { container } = render(<SecondaryButton>Test</SecondaryButton>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-white/5");
    expect(button).toHaveClass("backdrop-blur-md");
    expect(button).toHaveClass("border");
  });

  it("OPENS LINK IN NEW TAB WITH TARGET _BLANK", () => {
    render(<SecondaryButton href="/test">Link</SecondaryButton>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("HANDLES DOWNLOAD ATTRIBUTE", () => {
    render(
      <SecondaryButton href="/file.pdf" download="filename.pdf">
        Download
      </SecondaryButton>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("download", "filename.pdf");
  });

  it("SHOWS ARROW WHEN SHOWARROW PROP IS TRUE", () => {
    const { container } = render(
      <SecondaryButton showArrow>Click me</SecondaryButton>
    );
    const arrows = container.querySelectorAll("span");
    const found = Array.from(arrows).some((span) => span.textContent === "↗");
    expect(found).toBe(true);
  });

  it("DISABLES BUTTON WHEN DISABLED PROP IS TRUE", () => {
    render(<SecondaryButton disabled>Disabled</SecondaryButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("ACCEPTS CUSTOM CLASSNAME", () => {
    const { container } = render(
      <SecondaryButton className="custom-class">Test</SecondaryButton>
    );
    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });
});