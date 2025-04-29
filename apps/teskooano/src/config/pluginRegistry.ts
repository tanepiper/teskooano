import type { PluginRegistryConfig } from "@teskooano/ui-plugin";

export const pluginConfig: PluginRegistryConfig = {
  "core-engine-view": { path: "../plugins/engine" },

  "core-engine-ui-controls": {
    path: "../plugins/engine-toolbar/engine-settings/EngineSettings.plugin.ts",
  },
  "core-focus-controls": {
    path: "../plugins/engine-toolbar/focus/FocusControl.plugin.ts",
  },
  "core-engine-info": {
    path: "../plugins/engine-toolbar/engine-info/EngineInfo.plugin.ts",
  },
  "core-celestial-info": {
    path: "../plugins/engine-toolbar/celestial-info/CelestialInfo.plugin.ts",
  },
  "core-tour": { path: "../core/tours/Tour.plugin.ts" },
  "core-settings": { path: "../plugins/settings/Settings.plugin.ts" },
};
