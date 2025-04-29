import type { ComponentRegistryConfig } from "@teskooano/ui-plugin";

// This file now only contains application-specific components.
// The core components are loaded via the vite.config.ts
export const componentConfig: ComponentRegistryConfig = {
  "teskooano-simulation-controls": {
    path: "../plugins/engine/main-toolbar/simulation-controls/SimulationControls.ts",
    className: "SimulationControls",
    isCustomElement: true,
  },
  "teskooano-system-controls": {
    path: "../plugins/engine/main-toolbar/system-controls/SystemControls.ts",
    className: "SystemControls",
    isCustomElement: true,
  },
};
