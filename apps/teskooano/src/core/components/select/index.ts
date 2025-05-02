import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoSelect } from "./Select";

export * from "./Select";

/**
 * Plugin definition for the core Select component.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-select",
  name: "Core Select Component",
  description: "Provides the teskooano-select custom element.",

  components: [
    {
      tagName: "teskooano-select",
      componentClass: TeskooanoSelect,
    },
  ],

  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
