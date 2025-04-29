import type { ComponentRegistryConfig } from "@teskooano/ui-plugin";
import { coreComponents } from "../core";

export const componentConfig: ComponentRegistryConfig = {
  ...coreComponents,
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
