import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@teskooano/systems-celestial",

    environment: "happy-dom",

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

    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
