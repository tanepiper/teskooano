import type { PluginRegistryConfig } from "@teskooano/ui-plugin";

export const pluginConfig: PluginRegistryConfig = {
  "core-button": { path: "../core/components/button" },
  "core-modal": { path: "../core/components/modal" },
  
  "core-card": { path: "../core/components/card" },
  "core-output": { path: "../core/components/output" },
  "core-select": { path: "../core/components/select" },
  "core-slider": { path: "../core/components/slider" },
  "core-tooltip": { path: "../core/components/tooltip" },
  "core-external-links": {
    path: "../plugins/external-links",
  },
  "core-engine-view": { path: "../plugins/engine-panel" },

  "core-engine-ui-controls": {
    path: "../plugins/engine-settings/EngineSettings.plugin.ts",
  },
  "core-focus-controls": {
    path: "../plugins/focus/FocusControl.plugin.ts",
  },
  "core-engine-info": {
    path: "../plugins/engine-info/EngineInfo.plugin.ts",
  },
  "core-celestial-info": {
    path: "../plugins/celestial-info/CelestialInfo.plugin.ts",
  },
  "core-tour": { path: "../core/interface/tour-controller" },
  "core-settings": {
    path: "../plugins/settings/Settings.plugin.ts",
  },
  "camera-manager": { path: "../plugins/camera-manager" },
  
  "core-engine-toolbar": { path: "../core/interface/engine-toolbar" },
  "core-simulation-controls": {
    path: "../plugins/engine-panel/main-toolbar/simulation-controls",
  },
  "core-system-controls": {
    path: "../plugins/engine-panel/main-toolbar/system-controls",
  },

};
