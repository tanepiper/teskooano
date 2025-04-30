import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { SimulationControls } from "./SimulationControls";

// Plugin definition for the simulation controls component
export const plugin: TeskooanoPlugin = {
  id: "core-simulation-controls",
  name: "Core Simulation Controls",
  description: "Provides the simulation playback controls component.",
  components: [
    {
      tagName: "teskooano-simulation-controls",
      componentClass: SimulationControls,
    },
  ],
  // No panels, functions, toolbars, or managers
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  managerClasses: [],
}; 