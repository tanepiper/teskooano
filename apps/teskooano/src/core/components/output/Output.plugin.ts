import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoOutputDisplay } from "./OutputDisplay";
import { TeskooanoLabeledValue } from "./LabeledValue";

/**
 * Plugin definition for the core Output components.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-output", // Unique ID for this plugin
  name: "Core Output Components",
  description:
    "Provides the teskooano-output-display and teskooano-labeled-value custom elements.",

  // Register the custom element components
  components: [
    {
      tagName: "teskooano-output-display",
      componentClass: TeskooanoOutputDisplay,
    },
    {
      tagName: "teskooano-labeled-value",
      componentClass: TeskooanoLabeledValue,
    },
  ],

  // No manager classes, panels, functions, or toolbar items for these components
  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
