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
      "@teskooano/core-state": resolve(__dirname, "../../core/state/src"),
      "@teskooano/data-types": resolve(__dirname, "../../data/types/src"),
      "@teskooano/core-physics": resolve(__dirname, "../../core/physics/src"),
      "@teskooano/core-math": resolve(__dirname, "../../core/math/src"),
      "@teskooano/renderer-threejs": resolve(
        __dirname,
        "../../renderer/threejs/src",
      ),
    },
  },
});
