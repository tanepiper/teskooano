import type { TeskooanoPlugin, ComponentConfig } from "@teskooano/ui-plugin";
import { SimulationControls } from "./SimulationControls";

const simulationControlsComponent: ComponentConfig = {
  tagName: "teskooano-simulation-controls",
  componentClass: SimulationControls,
};

/**
 * Plugin definition for the Simulation Controls component.
 *
 * Registers the SimulationControls custom element.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-simulation-controls",
  name: "Simulation Controls Component",
  description: "Provides the simulation playback controls component.",
  components: [simulationControlsComponent],

  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { SimulationControls };
