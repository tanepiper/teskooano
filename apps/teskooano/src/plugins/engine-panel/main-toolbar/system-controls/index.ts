import type {
  TeskooanoPlugin,
  FunctionConfig,
  ComponentConfig,
} from "@teskooano/ui-plugin";
import { SystemControls } from "./SystemControls";
// Import individual function configs
import {
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
} from "./system-functions";
import { addCompositeEnginePanelFunction } from "./engineview-functions";

// Aggregate functions from different files
const allFunctions: FunctionConfig[] = [
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
  addCompositeEnginePanelFunction,
];

// Component configuration
const systemControlsComponent: ComponentConfig = {
  tagName: "teskooano-system-controls",
  componentClass: SystemControls,
};

/**
 * Plugin definition for the System Controls component and related functions.
 *
 * Registers the SystemControls custom element and various functions for
 * system generation, clearing, import/export, and adding engine panels.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-system-controls", // Updated ID
  name: "System Controls",
  description:
    "Provides the system controls component and related system/view functions.",
  components: [systemControlsComponent],
  functions: allFunctions,
  // No panels, toolbars, or managers
  panels: [],
  toolbarRegistrations: [],
  toolbarWidgets: [], // Added for completeness
  managerClasses: [],
};

// Export the component class directly if needed elsewhere
export { SystemControls };
