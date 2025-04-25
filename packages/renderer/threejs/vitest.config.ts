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
      "@teskooano/data-types": resolve(__dirname, "../../data/types/src"),
      "@teskooano/renderer-threejs-core": resolve(
        __dirname,
        "../threejs-core/src",
      ),
      "@teskooano/renderer-threejs-interaction": resolve(
        __dirname,
        "../threejs-interaction/src",
      ),
      "@teskooano/renderer-threejs-effects": resolve(
        __dirname,
        "../threejs-effects/src",
      ),
      "@teskooano/systems-celestial": resolve(
        __dirname,
        "../../systems/celestial/src",
      ),
    },
  },
});
