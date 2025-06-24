import type { pluginManager } from "@teskooano/ui-plugin";

/**
 * Handles initialization of application managers in the correct order
 */
export class ManagerInitializer {
  /**
   * Initializes core application managers
   */
  public static async initializeManagers(
    pluginManagerInstance: typeof pluginManager,
    appElement: HTMLElement,
    toolbarElement: HTMLElement,
    dockviewController: any
  ): Promise<{ modalManager: any }> {
    // Initialize engine view manager
    await pluginManagerInstance.execute("engine-view:initialize", {
      targetElement: appElement,
    });

    // Initialize toolbar manager
    try {
      await pluginManagerInstance.execute("toolbar:initialize", {
        targetElement: toolbarElement,
      });
    } catch (error) {
      console.error("[ManagerInitializer] Error during toolbar initialization:", error);
      throw error;
    }

    // Initialize and configure modal manager
    const modalManager = pluginManagerInstance.getManagerInstance<any>("modal-manager");
    if (!modalManager) {
      throw new Error("Failed to get ModalManager instance from plugin manager.");
    }

    if (typeof modalManager.initialize === "function") {
      modalManager.initialize(dockviewController);
    } else {
      throw new Error("ModalManager instance does not have an initialize method.");
    }

    // Initialize tour controller
    try {
      await pluginManagerInstance.execute("tour:initialize", {
        modalManager,
      });
    } catch (error) {
      console.error("[ManagerInitializer] Failed to initialize tour controller:", error);
    }

    // Initialize system controls
    await pluginManagerInstance.execute("system-controls:initialize", {
      dockviewController,
    });

    return { modalManager };
  }
}