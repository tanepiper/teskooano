import { CelestialLabelComponent } from "./celestial-label.component";

import type { TeskooanoPlugin } from "@teskooano/ui-plugin";

export * from "./celestial-label.component";

/**
 * Plugin definition for the core Output components.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-celestial-label",
  name: "Teskooano Celestial Label Components",
  description: "Provides the celestial-label custom element.",

  components: [
    {
      tagName: "teskooano-celestial-label",
      componentClass: CelestialLabelComponent,
    },
  ],

  managerClasses: [],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
