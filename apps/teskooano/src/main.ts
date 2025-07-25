import "@teskooano/design-system/styles.css";
import "dockview-core/dist/styles/dockview.css";
import "./vite-env.d";

import { pluginConfig } from "./config/pluginRegistry";
import { TeskooanoApp, pluginConfig as corePluginConfig } from "./core";

/**
 * Application entry point - orchestrates initialization
 */
async function initializeApp(): Promise<TeskooanoApp> {
  const pluginIds = [
    ...Object.keys(corePluginConfig),
    ...Object.keys(pluginConfig),
  ];

  try {
    const app = new TeskooanoApp({
      pluginIds,
      appName: "Teskooano",
      version: import.meta.env.PACKAGE_VERSION || "dev",
      gitHash: import.meta.env.GIT_COMMIT_HASH || "local",
    });

    await app.start();
    return app;
  } catch (error) {
    console.error("[App] Unhandled error during application startup:", error);
    console.trace(error);
    throw error;
  }
}

// Start the application
initializeApp()
  .then((app) => {
    console.log(`🛰️ ${app.appName} v${app.version} (${app.gitHash})`);
    // @ts-expect-error - globalThis is not typed
    window["teskooano"] = app;
  })
  .catch((err) => {
    console.error("[App] Critical startup failure:", err);
    console.trace(err);
  });
