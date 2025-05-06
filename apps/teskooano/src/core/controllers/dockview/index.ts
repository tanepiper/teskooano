import type {
  TeskooanoPlugin,
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import { DockviewController } from "./DockviewController";
import { FallbackPanel } from "./FallbackPanel";
import type { DockviewApi } from "dockview-core";

export * from "./DockviewController";
export * from "./GroupManager";
export * from "./OverlayManager";
export * from "./FallbackPanel";
export * from "./types";

/**
 * Initialization function for the Dockview system.
 * Expected context: { appElement: HTMLElement }
 */
const initializeDockview: FunctionConfig = {
  id: "dockview:initialize",
  execute: async (
    _: PluginExecutionContext,
    options?: { appElement?: HTMLElement },
  ): Promise<{ controller: DockviewController; api: DockviewApi }> => {
    const appElement = options?.appElement;
    if (!appElement) {
      throw new Error(
        "[DockviewPlugin] Initialization failed: appElement is required in options.",
      );
    }

    const controller = new DockviewController(appElement);

    return {
      controller: controller,
      api: controller.api,
    };
  },
};

/**
 * The standard TeskooanoPlugin definition for the Dockview controller.
 */
export const plugin: TeskooanoPlugin = {
  id: "core-dockview",
  name: "Core Dockview Controller",
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
