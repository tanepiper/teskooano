import type {
  TeskooanoPlugin,
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import { DockviewController } from "./dockview-controller/DockviewController";
import { FallbackPanel } from "./fallback-panel";
import type { DockviewApi } from "dockview-core";

export * from "./dockview-controller/DockviewController";
export * from "./group-manager";
export * from "./overlay-manager";
export * from "./fallback-panel";
export * from "./types";

/**
 * Initialization function for the Dockview system.
 * Expected context: { appElement: HTMLElement }
 */
const initializeDockview: FunctionConfig = {
  id: "dockview:initialize",
  execute: async (
    context: PluginExecutionContext,
    options?: { appElement?: HTMLElement },
  ): Promise<{ controller: DockviewController; api: DockviewApi }> => {
    const appElement = options?.appElement;
    if (!appElement) {
      throw new Error(
        "[DockviewPlugin] Initialization failed: appElement is required in options.",
      );
    }
    const dockviewController = new DockviewController(appElement);

    // Initialize global UI managers that append to the main view
    try {
      const notificationUIManager = await context.pluginManager.execute(
        "notifications:initialize",
        context,
      );
      if (notificationUIManager) {
        notificationUIManager.createContainer(appElement);
      }
    } catch (error) {
      console.error("[Dockview] Failed to initialize notifications UI:", error);
    }

    return {
      controller: dockviewController,
      api: dockviewController.api,
    };
  },
};

/**
 * The standard TeskooanoPlugin definition for the Dockview controller.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-dockview",
  name: "Teskooano Dockview",
  description:
    "Provides the main DockviewController instance via an initialization function.",
  functions: [initializeDockview],
  panels: [
    {
      componentName: "fallback-panel",
      panelClass: FallbackPanel,
      defaultTitle: "Error",
    },
  ],
  components: [],
  managerClasses: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
