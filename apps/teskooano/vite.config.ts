import { defineConfig, PluginOption } from "vite";
import glsl from "vite-plugin-glsl";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

import { teskooanoUiPlugin } from "@teskooano/ui-plugin/vite.js";

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
);
const appVersion = packageJson.version;

let gitCommitHash = "N/A";
try {
  gitCommitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch (e) {
  console.warn("Could not get git commit hash:", e);
}

const basePath = process.env.CI ? "/teskooano" : "/";

export default defineConfig({
  plugins: [
    teskooanoUiPlugin({
      pluginRegistryPaths: [
        path.resolve(__dirname, "src/core/config/pluginRegistry.ts"),
        path.resolve(__dirname, "src/config/pluginRegistry.ts"),
      ],
    }),
    glsl({
      include: [
        "**/*.glsl",
        "**/*.vert",
        "**/*.frag",
        "../../**/*.glsl",
        "../../**/*.vert",
        "../../**/*.frag",
      ],
    }),
    VitePWA({
      registerType: "prompt",
      workbox: {
        cleanupOutdatedCaches: false,
      },
      manifest: {
        name: "Teskooano 3D N-Body Simulator",
        short_name: "Teskooano",
        description: "N-Body Physics Simulation",
        theme_color: "#2a2a3e",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ] as PluginOption[],
  base: basePath,

  define: {
    "import.meta.env.PACKAGE_VERSION": JSON.stringify(appVersion),
    "import.meta.env.GIT_COMMIT_HASH": JSON.stringify(gitCommitHash),
  },

  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
