import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", "dist/**"],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {
          browser: "chromium",
          headless: true,
          screenshotFailures: false,
        },
      ],
    },
  },
  resolve: {
    alias: {
      "@teskooano/core-math": resolve(__dirname, "../math/src"),
      "@teskooano/core-state": resolve(__dirname, "../state/src"),
      "@teskooano/data-types": resolve(__dirname, "../../data/types/src"),
    },
  },
});
