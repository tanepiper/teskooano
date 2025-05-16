import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoTooltip } from "./Tooltip";

export * from "./Tooltip";

/**
 * Plugin definition for the core Tooltip component.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-tooltip",
  name: "Teskooano Tooltip",
  description: "Provides the teskooano-tooltip custom element.",

  components: [
    {
      tagName: "teskooano-tooltip",
      componentClass: TeskooanoTooltip,
    },
  ],

  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
