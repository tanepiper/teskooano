/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />
/// <reference types="playwright" />

// Add type declarations for browser testing
export {}; // Make this a module

declare global {
  interface Window {
    __testReady?: boolean;
    __renderer?: any;
    __resizeCalled?: boolean;
  }
}

// Add any global setup for browser tests here
