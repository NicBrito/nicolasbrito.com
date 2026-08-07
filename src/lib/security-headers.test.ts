import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, buildSecurityHeaders } from "./security-headers";

// The exact production CSP string this file's docblock promises. Spelled out in full
// (rather than re-derived) so this test fails loudly if security-headers.ts drifts.
const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

describe("security-headers", () => {
  // ---------------------------------------------------------------------------
  // buildSecurityHeaders(false) — byte-identity pin of the frozen production
  // contract shared by next.config.ts and src/proxy.ts.
  // ---------------------------------------------------------------------------
  describe("buildSecurityHeaders(false)", () => {
    it("deep-equals the exact six-entry production header set, CSP first and HSTS last", () => {
      // Arrange — the literal contract this site ships in production; any accidental
      // reorder, rename, or value drift in the source must fail this assertion.
      const expected = [
        { key: "Content-Security-Policy", value: PROD_CSP },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ];

      // Act
      const actual = buildSecurityHeaders(false);

      // Assert
      expect(actual).toEqual(expected);
    });

    it("carries the exact HSTS value required for hstspreload.org eligibility", () => {
      // Arrange
      const headers = buildSecurityHeaders(false);

      // Act
      const hsts = headers.find((header) => header.key === "Strict-Transport-Security");

      // Assert — both includeSubDomains and preload directives must be present verbatim
      expect(hsts?.value).toBe("max-age=63072000; includeSubDomains; preload");
    });
  });

  // ---------------------------------------------------------------------------
  // buildContentSecurityPolicy — production vs development variants
  // ---------------------------------------------------------------------------
  describe("buildContentSecurityPolicy", () => {
    it("forces HTTPS upgrades and forbids unsafe-eval in production", () => {
      // Arrange & Act
      const csp = buildContentSecurityPolicy(false);

      // Assert
      expect(csp).toContain("upgrade-insecure-requests");
      expect(csp).not.toContain("unsafe-eval");
    });

    it("relaxes eval and opens a websocket for Turbopack HMR in development, without the HTTPS upgrade", () => {
      // Arrange & Act
      const csp = buildContentSecurityPolicy(true);

      // Assert
      expect(csp).toContain("unsafe-eval");
      expect(csp).toContain("ws: wss:");
      expect(csp).not.toContain("upgrade-insecure-requests");
    });
  });

  // ---------------------------------------------------------------------------
  // buildSecurityHeaders — dev/prod parity: identical key set and order; only
  // the Content-Security-Policy value is environment-dependent.
  // ---------------------------------------------------------------------------
  describe("buildSecurityHeaders — dev/prod parity", () => {
    it("returns the same six header keys in the same order for both environments", () => {
      // Arrange
      const prodHeaders = buildSecurityHeaders(false);
      const devHeaders = buildSecurityHeaders(true);

      // Act
      const prodKeys = prodHeaders.map((header) => header.key);
      const devKeys = devHeaders.map((header) => header.key);

      // Assert
      expect(prodKeys).toHaveLength(6);
      expect(devKeys).toEqual(prodKeys);
    });

    it("differs from the development variant only in the Content-Security-Policy value", () => {
      // Arrange
      const prodHeaders = buildSecurityHeaders(false);
      const devHeaders = buildSecurityHeaders(true);

      // Act — pair each prod header with its dev counterpart by key and collect the
      // keys whose values diverge between environments.
      const diverging = prodHeaders
        .filter((prodHeader) => {
          const devHeader = devHeaders.find((header) => header.key === prodHeader.key);
          return devHeader?.value !== prodHeader.value;
        })
        .map((header) => header.key);

      // Assert — only the CSP header's value should diverge
      expect(diverging).toEqual(["Content-Security-Policy"]);
    });
  });
});
