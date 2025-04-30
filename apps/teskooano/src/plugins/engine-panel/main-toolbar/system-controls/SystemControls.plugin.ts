import type { TeskooanoPlugin, FunctionConfig } from "@teskooano/ui-plugin";
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

// Plugin definition for the system controls component and related functions
export const plugin: TeskooanoPlugin = {
  id: "core-system-controls",
  name: "Core System Controls",
  description:
    "Provides the system controls component and related system/view functions.",
  components: [
    {
      tagName: "teskooano-system-controls",
      componentClass: SystemControls,
    },
  ],
  functions: allFunctions,
  // No panels, toolbars, or managers
  panels: [],
  toolbarRegistrations: [],
  managerClasses: [],
};
