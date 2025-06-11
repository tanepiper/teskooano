import type { TeskooanoPlugin, ComponentConfig } from "@teskooano/ui-plugin";
import { SimulationControls } from "./view/simulation-controls.component";

/**
 * The component configuration for the simulation controls.
 * This tells the PluginManager how to register the component.
 */
const simulationControlsComponent: ComponentConfig = {
  tagName: "teskooano-simulation-controls",
  componentClass: SimulationControls,
};

/**
 * The main plugin definition for the Simulation Controls feature.
 *
 * This plugin exports a single main component:
 * - The `<teskooano-simulation-controls>` custom element.
 *
 * This component is self-contained and manages its own logic via its
 * controller, making the plugin definition very straightforward.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-simulation-controls",
  name: "Simulation Controls",
  description:
    "Provides the simulation controls component for playback and time management.",
  components: [simulationControlsComponent],
};

// Export the component class for potential direct instantiation or type usage.
export { SimulationControls };
