import {
  type FunctionConfig,
  type PluginExecutionContext,
  type TeskooanoPlugin,
} from "@teskooano/ui-plugin";

import { ToolbarController } from "./ToolbarController.js";

/**
 * Options required to initialize the toolbar.
 */
export interface ToolbarInitOptions {
  /** The HTMLElement where the toolbar will be rendered. */
  targetElement: HTMLElement;
}

/**
 * A plugin function that initializes the main application toolbar.
 *
 * This function creates and configures the `ToolbarController` which is
 * responsible for rendering and managing the toolbar's lifecycle.
 */
const initializeToolbar: FunctionConfig = {
  id: "toolbar:initialize",
  dependencies: {
    dockView: {
      api: true,
      controller: true,
    },
  },
  execute: async (
    context: PluginExecutionContext,
    args: ToolbarInitOptions,
  ) => {
    if (!args.targetElement) {
      console.error(
        "[core-toolbar] Initialization failed: targetElement is missing.",
      );
      return;
    }

    try {
      const controller = new ToolbarController(args.targetElement, context);
      return controller;
    } catch (error) {
      console.error("[core-toolbar] Failed to initialize:", error);
      throw error;
    }
  },
};

export const functions = [initializeToolbar];

export const plugin: TeskooanoPlugin = {
  id: "core-toolbar",
  name: "Core Toolbar",
  description: "Initializes the main application toolbar.",
  functions: [initializeToolbar],
};

export * from "./ToolbarController";
export * from "./ToolbarController.utils";
