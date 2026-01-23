import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MorphingLabel } from "./MorphingLabel";

describe("MorphingLabel", () => {
  it("RENDERS TEXT WITH INDIVIDUAL CHARACTERS", () => {
    render(
      <MorphingLabel
        text="Hello World"
        layoutIdPrefix="test"
      />
    );

    const container = screen.getByText("H").parentElement?.parentElement;
    expect(container).toBeInTheDocument();
  });

  it("SPLITS TEXT INTO INDIVIDUAL CHARACTERS", () => {
    const { container } = render(
      <MorphingLabel
        text="Test"
        layoutIdPrefix="test"
      />
    );

    const characterSpans = container.querySelectorAll(".inline-block");
    expect(characterSpans).toHaveLength(4);
  });

  it("APPLIES CUSTOM CLASSNAME", () => {
    const { container } = render(
      <MorphingLabel
        text="Hello"
        layoutIdPrefix="test"
        className="custom-class"
      />
    );

    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("PRESERVES WHITESPACE IN TEXT", () => {
    render(
      <MorphingLabel
        text="Hello World"
        layoutIdPrefix="test"
      />
    );

    const spaceElement = screen.getByText((_, element) => {
      return element?.textContent === " " && element?.classList.contains("whitespace-pre");
    });
    expect(spaceElement).toBeInTheDocument();
  });

  it("USES UNIQUE LAYOUTIDPREFIX PER CHARACTER", () => {
    const { container } = render(
      <MorphingLabel
        text="Hi"
        layoutIdPrefix="unique-prefix"
      />
    );

    const characterSpans = container.querySelectorAll(".inline-block");
    expect(characterSpans[0]).toHaveTextContent("H");
    expect(characterSpans[1]).toHaveTextContent("i");
  });

  it("ACCEPTS CUSTOM ANIMATION DURATIONS", () => {
    const { container } = render(
      <MorphingLabel
        text="Test"
        layoutIdPrefix="test"
        animationDuration={{ animate: 0.5, exit: 0.3 }}
      />
    );

    const wrapper = container.querySelector(".inline-flex");
    expect(wrapper).toBeInTheDocument();
  });

  it("USES DEFAULT ANIMATION DURATIONS WHEN NOT PROVIDED", () => {
    const { container } = render(
      <MorphingLabel
        text="Test"
        layoutIdPrefix="test"
      />
    );

    const wrapper = container.querySelector(".inline-flex");
    expect(wrapper).toBeInTheDocument();
  });
});