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
      "@teskooano/renderer-threejs-lighting": resolve(
        __dirname,
        "../threejs-lighting/src",
      ),
      "@teskooano/renderer-threejs-lod": resolve(
        __dirname,
        "../threejs-lod/src",
      ),
      "@teskooano/renderer-threejs-controls": resolve(
        __dirname,
        "../threejs-controls/src",
      ),
      "@teskooano/renderer-threejs-labels": resolve(
        __dirname,
        "../threejs-labels/src",
      ),
      "@teskooano/renderer-threejs-objects": resolve(
        __dirname,
        "../threejs-objects/src",
      ),
      "@teskooano/systems-celestial": resolve(
        __dirname,
        "../../systems/celestial/src",
      ),
    },
  },
});
