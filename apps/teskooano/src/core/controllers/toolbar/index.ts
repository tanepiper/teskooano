import { createControllerPlugin } from "@teskooano/ui-plugin";
import type {
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import { mount, unmount } from "svelte";
import ToolbarSvelte from "./Toolbar.svelte";

/**
 * Options required to initialize the toolbar.
 */
export interface ToolbarInitOptions {
  /** The HTMLElement where the toolbar will be rendered. */
  targetElement: HTMLElement;
}

/**
 * A plugin function that mounts the Svelte Toolbar component into the
 * provided target element.
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
      const instance = mount(ToolbarSvelte, {
        target: args.targetElement,
        props: { context },
      });

      // Return a dispose handle for cleanup
      return {
        destroy: () => unmount(instance),
      };
    } catch (error) {
      console.error("[core-toolbar] Failed to initialize:", error);
      throw error;
    }
  },
};

export const plugin = createControllerPlugin({
  id: "core-toolbar",
  name: "Core Toolbar",
  description: "Initializes the main application toolbar.",
  functions: [initializeToolbar],
});

export * from "./Toolbar.svelte";
