import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@teskooano/systems-celestial",
    // Default to happy-dom for lightweight tests
    environment: "happy-dom",
    // Use Playwright for browser-based tests - we'll enable this when we need real rendering
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: false,
    },
    globals: true,
    include: ["src/**/*.spec.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/examples/**"],
    },
    // deps: {
    //   // Inline dependencies so they work properly in the browser
    //   inline: [/three/]
    // },
    // Set timeouts to account for startup of browser
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
