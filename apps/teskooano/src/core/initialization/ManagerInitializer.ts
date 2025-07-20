import type { pluginManager } from "@teskooano/ui-plugin";

/**
 * Handles initialization of application managers in the correct order
 */
export class ManagerInitializer {
  /**
   * Initializes core application managers
   * @throws {Error} If any critical manager fails to initialize
   */
  public static async initializeManagers(
    pluginManagerInstance: typeof pluginManager,
    appElement: HTMLElement,
    toolbarElement: HTMLElement,
    dockviewController: any,
  ): Promise<{ modalManager: any }> {
    try {
      // Initialize engine view manager (critical)
      console.debug("[ManagerInit] Initializing engine view...");
      await pluginManagerInstance.execute("engine-view:initialize", {
        targetElement: appElement,
      });

      // Initialize toolbar manager (critical)
      console.debug("[ManagerInit] Initializing toolbar...");
      await pluginManagerInstance.execute("toolbar:initialize", {
        targetElement: toolbarElement,
      });

      // Initialize and configure DockView modal manager (critical)
      console.debug("[ManagerInit] Initializing DockView modal manager...");
      const modalManager = pluginManagerInstance.getManagerInstance<any>(
        "dockview-modal-manager",
      );
      if (!modalManager) {
        throw new Error(
          "Failed to get DockViewModalManager instance from plugin manager.",
        );
      }

      if (typeof modalManager.initialize === "function") {
        modalManager.initialize(dockviewController);
      } else {
        throw new Error(
          "DockViewModalManager instance does not have an initialize method.",
        );
      }

      // Initialize system controls (critical)
      console.debug("[ManagerInit] Initializing system controls...");
      await pluginManagerInstance.execute("system-controls:initialize", {
        dockviewController,
      });

      // Initialize tour controller (optional - shouldn't block startup)
      console.debug("[ManagerInit] Initializing tour controller...");
      try {
        await pluginManagerInstance.execute("tour:initialize", {
          dockviewController,
          modalManager,
        });
      } catch (error) {
        console.warn(
          "[ManagerInit] Tour controller initialization failed (non-critical):",
          error,
        );
        // Tour is optional, don't let this block the app
      }

      return { modalManager };
    } catch (error) {
      throw new Error(
        `Manager initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
