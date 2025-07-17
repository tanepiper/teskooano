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
      "@": resolve(__dirname, "./src"),
      "@teskooano/core-state": resolve(
        __dirname,
        "../../packages/core/state/src",
      ),
      "@teskooano/data-types": resolve(
        __dirname,
        "../../packages/data/types/src",
      ),
      "@teskooano/renderer-threejs": resolve(
        __dirname,
        "../../packages/renderer/threejs/src",
      ),
      "@teskooano/app-simulation": resolve(
        __dirname,
        "../../packages/app/simulation/src",
      ),
      "@teskooano/web-apis": resolve(
        __dirname,
        "../../packages/app/web-apis/src",
      ),
      "@teskooano/design-system": resolve(
        __dirname,
        "../../packages/app/design-system/src",
      ),
      "@teskooano/ui-plugin": resolve(
        __dirname,
        "../../packages/app/ui-plugin/src",
      ),
    },
  },
});
