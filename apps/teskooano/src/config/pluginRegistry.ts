import type { PluginRegistryConfig } from "@teskooano/ui-plugin";
// import { pluginConfig as uiPluginConfig } from "@teskooano/ui-lib/plugins"; // REMOVED Example import

// Defines the UI feature plugins to load.
// The keys are unique plugin IDs used for identification.
// The paths should point to the module exporting the `TeskooanoPlugin` object
// (exported as 'plugin' by default).

export const pluginConfig: PluginRegistryConfig = {
  // --- Core Engine View --- // (Register this first, seems fundamental)
  "core-engine-view": { path: "../components/engine/EngineView.plugin.ts" },

  // --- UI Controls & Features --- //
  "core-engine-ui-controls": {
    path: "../components/ui-controls/engine-settings/EngineSettings.plugin.ts",
  },
  "core-focus-controls": {
    path: "../components/ui-controls/focus/FocusControl.plugin.ts",
  },
  "core-engine-info": {
    path: "../components/ui-controls/engine-info/EngineInfo.plugin.ts",
  },
  "core-celestial-info": {
    path: "../components/ui-controls/celestial-info/CelestialInfo.plugin.ts",
  },

  // --- System Actions & Tour --- //
  "core-system-actions": { path: "../plugins/SystemActions.plugin.ts" },
  "core-tour": { path: "../plugins/Tour.plugin.ts" },

  // --- Library Plugins (Example) --- //
  // ...uiPluginConfig, // Spread in plugins from ui-lib if needed

  // Example (add actual feature plugins here later):
  // 'feature-celestial-info': { path: '@teskooano/celestial-info-plugin' },
};
