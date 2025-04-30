import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoCard } from "./Card";

/**
 * Plugin definition for the core Card component.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-card", // Unique ID for this plugin
  name: "Core Card Component",
  description: "Provides the teskooano-card custom element.",

  // Register the custom element component
  components: [
    {
      tagName: "teskooano-card",
      componentClass: TeskooanoCard,
    },
  ],

  // No manager classes, panels, functions, or toolbar items for this component
  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
}; 