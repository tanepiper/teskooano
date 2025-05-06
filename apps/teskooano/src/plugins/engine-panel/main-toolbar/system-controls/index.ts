import type {
  TeskooanoPlugin,
  FunctionConfig,
  ComponentConfig,
} from "@teskooano/ui-plugin";
import { SystemControls } from "./SystemControls";

import {
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
} from "./system-functions";
import { addCompositeEnginePanelFunction } from "./engineview-functions";

const allFunctions: FunctionConfig[] = [
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
  addCompositeEnginePanelFunction,
];

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
  id: "teskooano-system-controls",
  name: "System Controls",
  description:
    "Provides the system controls component and related system/view functions.",
  components: [systemControlsComponent],
  functions: allFunctions,

  panels: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { SystemControls };
