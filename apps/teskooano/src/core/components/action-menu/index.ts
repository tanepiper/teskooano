import { createControllerPlugin } from "@teskooano/ui-plugin";
import { ActionMenuManager } from "./action-menu-manager";
import { ActionMenuComponent } from "./view/action-menu.component";

export * from "./controller/";
export * from "./view";
export * from "./action-menu-manager";

/**
 * Plugin definition for the Action Menu component.
 *
 * This component provides a configurable, reusable action menu system that supports:
 * - Multiple instances with unique IDs
 * - Factory patterns for creating menu instances
 * - Configurable direction, button size, and behavior
 * - Integration with the toolbar system
 * - Manager service for lifecycle management
 */
const pluginConfig = createControllerPlugin({
  id: "teskooano-action-menu",
  name: "Teskooano Action Menu",
  description:
    "Configurable action menu component with factory patterns and manager service.",
  functions: [
    {
      id: "action-menu:initialize",
      execute: async (context) => {
        return new ActionMenuManager(context);
      },
    },
  ],
  managerClasses: [
    {
      id: "action-menu-manager",
      managerClass: ActionMenuManager,
    },
  ],
});

// Manually add component registration since createControllerPlugin doesn't support it
export const plugin = {
  ...pluginConfig,
  components: [
    {
      tagName: "teskooano-action-menu",
      componentClass: ActionMenuComponent,
    },
  ],
};
