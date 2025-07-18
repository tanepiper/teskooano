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
      "@teskooano/core-physics": resolve(
        __dirname,
        "../../physics/src/index.ts",
      ),
      "@teskooano/core-math": resolve(__dirname, "../../math/src/index.ts"),
    },
  },
});
