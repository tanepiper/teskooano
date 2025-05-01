import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoSlider } from "./Slider";

export * from "./Slider";

/**
 * Plugin definition for the core Slider component.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-slider", // Match the registry key
  name: "Core Slider Component",
  description: "Provides the teskooano-slider custom element.",

  // Register the custom element component
  components: [
    {
      tagName: "teskooano-slider",
      componentClass: TeskooanoSlider,
    },
  ],

  // No manager classes, panels, functions, or toolbar items for this component
  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
