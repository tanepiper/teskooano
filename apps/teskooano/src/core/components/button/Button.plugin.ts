import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoButton } from "./Button";

/**
 * Plugin definition for the core Button component.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-button", // Unique ID for this plugin
  name: "Core Button Component",
  description: "Provides the teskooano-button custom element.",

  // Register the custom element component
  components: [
    {
      tagName: "teskooano-button",
      componentClass: TeskooanoButton,
    },
  ],

  // No manager classes, panels, functions, or toolbar items for this component
  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
}; 