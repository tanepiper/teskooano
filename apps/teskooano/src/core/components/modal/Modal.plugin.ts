import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoModal } from "./Modal";
import { TeskooanoModalManager } from "./ModalManager";

/**
 * Plugin definition for the core Modal system.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-modal", // Unique ID for this plugin
  name: "Core Modal System",
  description:
    "Provides the teskooano-modal custom element and the ModalManager service.",

  // Register the custom element component
  components: [
    {
      tagName: "teskooano-modal",
      componentClass: TeskooanoModal,
    },
  ],

  // Register the non-UI manager class
  managerClasses: [
    {
      id: "modal-manager", // Use a distinct ID for the manager
      managerClass: TeskooanoModalManager,
    },
  ],

  // No panels, functions, or toolbar items specific to this plugin
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
}; 