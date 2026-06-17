"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Mirrors a reactive value into a ref that always holds the latest committed
 * value, without making event handlers or imperative loops (RAF, listeners)
 * depend on — and therefore re-subscribe to — that value.
 *
 * The ref is seeded synchronously with the initial value and updated in an
 * effect, so reads inside event handlers see the value as of the last commit.
 */
export function useLiveRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
