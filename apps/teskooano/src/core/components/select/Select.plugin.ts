import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoSelect } from "./Select";

/**
 * Plugin definition for the core Select component.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-select", // Unique ID for this plugin
  name: "Core Select Component",
  description: "Provides the teskooano-select custom element.",

  // Register the custom element component
  components: [
    {
      tagName: "teskooano-select",
      componentClass: TeskooanoSelect,
    },
  ],

  // No manager classes, panels, functions, or toolbar items for this component
  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
