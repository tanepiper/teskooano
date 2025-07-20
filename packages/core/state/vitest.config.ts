import { defineConfig } from "vitest/config";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    exclude: ["node_modules/**", "dist/**"],
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
  optimizeDeps: {
    include: [
      "@teskooano/core-math",
      "@teskooano/core-physics",
      "@teskooano/data-types",
    ],
  },
});
