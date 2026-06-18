import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLiveRef } from "./useLiveRef";

describe("useLiveRef", () => {
  // -------------------------------------------------------------------------
  // Initial render: ref is seeded synchronously with the initial value.
  // -------------------------------------------------------------------------
  it("seeds the ref synchronously with the initial value on first render", () => {
    // Arrange
    const initialValue = "hello";

    // Act
    const { result } = renderHook(() => useLiveRef(initialValue));

    // Assert — ref.current holds the initial value immediately after mount
    expect(result.current.current).toBe("hello");
  });

  it("seeds the ref with the correct initial value for number type", () => {
    // Arrange
    const initialValue = 42;

    // Act
    const { result } = renderHook(() => useLiveRef(initialValue));

    // Assert
    expect(result.current.current).toBe(42);
  });

  // -------------------------------------------------------------------------
  // Re-render: effect updates the ref to the new value after the commit.
  // -------------------------------------------------------------------------
  it("updates ref.current to the new value after a re-render", () => {
    // Arrange — start with value 'a'
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useLiveRef(value),
      { initialProps: { value: "a" } },
    );

    expect(result.current.current).toBe("a");

    // Act — re-render with a new value; act() flushes the effect
    act(() => {
      rerender({ value: "b" });
    });

    // Assert — ref.current reflects the committed value after the effect ran
    expect(result.current.current).toBe("b");
  });

  it("handles multiple sequential re-renders, always holding the latest committed value", () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useLiveRef(value),
      { initialProps: { value: 1 } },
    );

    // Act — two re-renders in sequence
    act(() => {
      rerender({ value: 2 });
    });
    act(() => {
      rerender({ value: 3 });
    });

    // Assert — final value is committed
    expect(result.current.current).toBe(3);
  });

  // -------------------------------------------------------------------------
  // Stable identity: the returned RefObject is the same object across renders
  // (important so imperative readers hold a stable reference).
  // -------------------------------------------------------------------------
  it("returns the same RefObject identity across re-renders", () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useLiveRef(value),
      { initialProps: { value: "first" } },
    );

    const refBefore = result.current;

    // Act
    act(() => {
      rerender({ value: "second" });
    });

    // Assert — same ref object, just with updated .current
    expect(result.current).toBe(refBefore);
    expect(result.current.current).toBe("second");
  });
});
