import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Deterministic secrets for crypto/env-dependent unit tests.
process.env.PHONE_ENCRYPTION_KEY =
  process.env.PHONE_ENCRYPTION_KEY || Buffer.alloc(32, 7).toString("base64");
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || "test-session-secret-of-sufficient-length-000";

afterEach(() => cleanup());

// jsdom lacks matchMedia (needed by next-themes / framer-motion useReducedMotion).
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

// jsdom lacks ResizeObserver (used by some Radix primitives).
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = ResizeObserver;
}
