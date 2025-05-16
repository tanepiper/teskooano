import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { TeskooanoButton } from "./Button";

/**
 * Plugin definition for the core Button component.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-button",
  name: "Teskooano Button",
  description: "Provides the teskooano-button custom element.",

  components: [
    {
      tagName: "teskooano-button",
      componentClass: TeskooanoButton,
    },
  ],

  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
