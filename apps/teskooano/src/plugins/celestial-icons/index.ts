import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { CelestialIconComponent } from "./components/celestial-icon/celestial-icon.component.js";

export { CelestialIconComponent };
export * from "./types.js";
export * from "./service/config-generator.js";

/**
 * Plugin definition for the Celestial Icons component library.
 *
 * This plugin doesn't register any panels or toolbars itself, but provides
 * the <celestial-icon> component to be used by other parts of the UI,
 * such as the celestial hierarchy view.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-celestial-icons",
  name: "Celestial Icons",
  description: "Provides the <celestial-icon> component.",
  panels: [],
  toolbarRegistrations: [],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
  components: [
    {
      componentClass: CelestialIconComponent,
      tagName: "celestial-icon",
    },
  ],
};
