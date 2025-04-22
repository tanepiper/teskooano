import { defineConfig, PluginOption } from "vite";
import glsl from "vite-plugin-glsl"; // Import the plugin
import { VitePWA } from "vite-plugin-pwa";

const basePath = process.env.CI ? "/teskooano" : "/";

export default defineConfig({
  plugins: [
    glsl(), // Add the plugin to the plugins array
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Teskooano 3D N-Body Simulator",
        short_name: "Teskooano",
        description: "N-Body Physics Simulation",
        theme_color: "#2a2a3e",
        icons: [
          {
            src: "pwa-192x192.png", // Make sure you have this icon in public/
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png", // And this one too
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ] as PluginOption[],
  base: basePath,

  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
