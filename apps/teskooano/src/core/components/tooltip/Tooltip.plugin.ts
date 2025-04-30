import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoTooltip } from "./Tooltip";

/**
 * Plugin definition for the core Tooltip component.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-tooltip", // Unique ID for this plugin
  name: "Core Tooltip Component",
  description: "Provides the teskooano-tooltip custom element.",

  // Register the custom element component
  components: [
    {
      tagName: "teskooano-tooltip",
      componentClass: TeskooanoTooltip,
    },
  ],

  // No manager classes, panels, functions, or toolbar items for this component
  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
