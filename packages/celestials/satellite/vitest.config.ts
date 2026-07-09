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
      "@teskooano/data-types": resolve(__dirname, "../../data/types/src"),
      "@teskooano/renderer-threejs-celestial": resolve(
        __dirname,
        "../../renderer/threejs-celestial/src",
      ),
      "@teskooano/renderer-threejs-lighting": resolve(
        __dirname,
        "../../renderer/threejs-lighting/src",
      ),

      "@teskooano/core-math": resolve(__dirname, "../../core/math/src"),
      "@teskooano/core-physics": resolve(__dirname, "../../core/physics/src"),
    },
  },
});
