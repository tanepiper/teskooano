import { ToolbarController } from "./ToolbarController";
// Import handlers and template if needed by the plugin consumer, or keep them internal
import { createToolbarHandlers } from "./ToolbarController.handlers";
// import { renderToolbarTemplate } from './ToolbarController.template'; // Template is likely internal
import type { DockviewController } from "../dockview/DockviewController"; // Dependency

/**
 * Initialization options for the Toolbar Plugin.
 */
export interface ToolbarPluginOptions {
  /** The target HTMLElement where the toolbar should be rendered. */
  targetElement: HTMLElement;
  /** An instance of the DockviewController for panel interactions. */
  dockviewController: DockviewController;
}

/**
 * Defines the structure for the Toolbar plugin.
 */
interface ToolbarPlugin {
  name: string;
  type: 'toolbar';
  /**
   * Initializes the Toolbar integration.
   * @param options Configuration options for the toolbar.
   * @returns An API object exposing the toolbar controller instance.
   */
  initialize: (options: ToolbarPluginOptions) => {
    controller: ToolbarController;
  };
  // Expose key types or components if necessary
  // types: { ... };
}

/**
 * The Toolbar plugin definition.
 *
 * This plugin creates and manages the main application toolbar,
 * populating it with static and dynamic items.
 */
export const plugin: ToolbarPlugin & { id: string } = {
  id: "teskooano-toolbar",
  name: "@teskooano/toolbar",
  type: "toolbar",
  initialize: (options: ToolbarPluginOptions) => {
    if (!options.targetElement) {
      throw new Error(
        "ToolbarPlugin: Initialization failed - targetElement is required.",
      );
    }
    if (!options.dockviewController) {
      throw new Error(
        "ToolbarPlugin: Initialization failed - dockviewController is required.",
      );
    }


    const controller = new ToolbarController(
      options.targetElement,
      options.dockviewController,
    );

    // Return the controller instance
    return {
      controller,
    };
  },
};

// Re-export core components and types for direct usage if needed
export * from "./ToolbarController";
export { createToolbarHandlers }; // Export handlers if they might be useful externally
// export * from './ToolbarController.template'; // Template likely internal
// export * from './ToolbarController.handlers'; // Already exported above 