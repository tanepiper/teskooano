import type { PluginRegistryConfig } from "@teskooano/ui-plugin";

export const pluginConfig: PluginRegistryConfig = {
  "teskooano-external-links": {
    path: "../plugins/external-links",
  },
  "teskooano-engine-panel": { path: "../plugins/engine-panel" },
  "teskooano-engine-settings": {
    path: "../plugins/engine-settings",
  },
  "teskooano-celestial-hierarchy": {
    path: "../plugins/celestial-hierarchy",
  },
  "teskooano-engine-info": {
    path: "../plugins/engine-info",
  },
  "teskooano-celestial-info": {
    path: "../plugins/celestial-info",
  },
  "teskooano-settings": {
    path: "../plugins/settings",
  },
  "teskooano-simulation-controls": {
    path: "../plugins/engine-panel/main-toolbar/simulation-controls",
  },
  "teskooano-system-controls": {
    path: "../plugins/engine-panel/main-toolbar/system-controls",
  },
  "teskooano-about": {
    path: "../plugins/about",
  },
  "teskooano-celestial-uniforms": {
    path: "../plugins/celestial-uniforms",
  },
  "teskooano-plugin-manager": {
    path: "../plugins/plugin-manager",
  },
  "teskooano-debug-panel": {
    path: "../plugins/debug-panel",
  },
  "teskooano-celestial-icons": {
    path: "../plugins/celestial-icons",
  },
};

export const INITIAL_PLUGINS: (keyof typeof pluginConfig)[] = [
  "teskooano-external-links",
  "teskooano-engine-panel",
  "teskooano-engine-settings",
  "teskooano-celestial-hierarchy",
  "teskooano-engine-info",
  "teskooano-celestial-info",
  "teskooano-settings",
  "teskooano-simulation-controls",
  "teskooano-system-controls",
  "teskooano-about",
  "teskooano-celestial-uniforms",
  "teskooano-plugin-manager",
  "teskooano-debug-panel",
  "teskooano-celestial-icons",
];
