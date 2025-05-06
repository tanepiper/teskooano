import { ToolbarController } from "./ToolbarController";

import { createToolbarHandlers } from "./ToolbarController.handlers";

import type { DockviewController } from "../dockview/DockviewController";

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
  type: "toolbar";
  /**
   * Initializes the Toolbar integration.
   * @param options Configuration options for the toolbar.
   * @returns An API object exposing the toolbar controller instance.
   */
  initialize: (options: ToolbarPluginOptions) => {
    controller: ToolbarController;
  };
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

    return {
      controller,
    };
  },
};

export * from "./ToolbarController";
export { createToolbarHandlers };
