import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    exclude: ["node_modules/**", "dist/**"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@teskooano/core-state": resolve(__dirname, "../../core/state/src"),
      "@teskooano/core-math": resolve(__dirname, "../../core/math/src"),
      "@teskooano/data-types": resolve(__dirname, "../../data/types/src"),
      "@teskooano/renderer-threejs": resolve(__dirname, "../threejs/src"),
      "@teskooano/renderer-threejs-helpers": resolve(
        __dirname,
        "../threejs-helpers/src",
      ),
      "@teskooano/notifications": resolve(
        __dirname,
        "../../app/notifications/src",
      ),
    },
  },
});
