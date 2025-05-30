export * from "./Toggle";

import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoToggle } from "./Toggle";

export * from "./Toggle";

/**
 * Plugin definition for the core Slider component.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-toggle",
  name: "Teskooano Toggle",
  description: "Provides the teskooano-toggle custom element.",

  components: [
    {
      tagName: "teskooano-toggle",
      componentClass: TeskooanoToggle,
    },
  ],

  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
