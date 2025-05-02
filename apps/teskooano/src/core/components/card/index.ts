import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoCard } from "./Card";

export * from "./Card";

/**
 * Plugin definition for the core Card component.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-card",
  name: "Core Card Component",
  description: "Provides the teskooano-card custom element.",

  components: [
    {
      tagName: "teskooano-card",
      componentClass: TeskooanoCard,
    },
  ],

  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
