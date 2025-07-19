import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", "dist/**"],
    browser: {
      enabled: true,
      provider: "playwright",
      name: "chromium",
      headless: true,
    },
  },
  resolve: {
    alias: {
      "@teskooano/data-types": resolve(
        __dirname,
        "../../data/types/src/index.ts",
      ),
      "@teskooano/core-state": resolve(
        __dirname,
        "../../core/state/src/index.ts",
      ),
      "@teskooano/core-math": resolve(
        __dirname,
        "../../core/math/src/index.ts",
      ),
      "@teskooano/core-physics": resolve(
        __dirname,
        "../../core/physics/src/index.ts",
      ),
    },
  },
});
