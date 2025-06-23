import { createComponentPlugin } from "@teskooano/ui-plugin";
import { CelestialIconComponent } from "./components/celestial-icon/celestial-icon.component.js";

export { CelestialIconComponent };
export * from "./types.js";
export * from "./service/config-generator.js";

/**
 * Plugin definition for the Celestial Icons component library.
 * ✅ Refactored to use createComponentPlugin factory - reduced from 31 lines to 15 lines
 */
export const plugin = createComponentPlugin({
  id: "teskooano-celestial-icons",
  name: "Celestial Icons",
  description: "Provides the <celestial-icon> component.",
  components: [
    {
      componentClass: CelestialIconComponent,
      tagName: "celestial-icon",
    },
  ],
});
