import "@teskooano/design-system/styles.css";
import "dockview-core/dist/styles/dockview.css";
import "./vite-env.d";

import { ApplicationInitializer } from "./core/initialization";
import { pluginConfig } from "./config/pluginRegistry";
import { pluginConfig as corePluginConfig } from "./core/config/pluginRegistry";
import { setRenderScaleAu } from "@teskooano/data-types";

interface AppContext {
  modalManager?: any;
  dockviewController?: any;
}

/**
 * Global application context for sharing state between components
 */
export const appContext: AppContext = {};

/**
 * Application entry point - orchestrates initialization
 */
async function initializeApp(): Promise<void> {
  // TODO: This should be driven by a user setting or config file
  setRenderScaleAu(1);

  const pluginIds = [
    ...Object.keys(corePluginConfig),
    ...Object.keys(pluginConfig),
  ];

  try {
    const result = await ApplicationInitializer.initialize(pluginIds);

    // Update global context for legacy components that depend on it
    Object.assign(appContext, result.appContext);
  } catch (error) {
    console.error("[App] Unhandled error during application startup:", error);
    throw error;
  }
}

// Start the application
initializeApp().catch((err) => {
  console.error("[App] Critical startup failure:", err);
});
