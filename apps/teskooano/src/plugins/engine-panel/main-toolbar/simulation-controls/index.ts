import type { TeskooanoPlugin, ComponentConfig } from "@teskooano/ui-plugin";
import { SimulationControls } from "./SimulationControls";

// Component configuration
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
  id: "teskooano-simulation-controls", // Updated ID
  name: "Simulation Controls Component",
  description: "Provides the simulation playback controls component.",
  components: [simulationControlsComponent],
  // No panels, functions, toolbars, or managers
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [], // Added for completeness
  managerClasses: [],
};

// Export the component class directly if needed elsewhere
export { SimulationControls };
