import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoTooltip } from "./Tooltip";

export * from "./Tooltip";

/**
 * Plugin definition for the core Tooltip component.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-tooltip",
  name: "Core Tooltip Component",
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
