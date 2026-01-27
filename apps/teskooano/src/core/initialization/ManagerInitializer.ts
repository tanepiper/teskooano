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
  ): Promise<void> {
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

      // Initialize system controls (critical)
      console.debug("[ManagerInit] Initializing system controls...");
      await pluginManagerInstance.execute("system-controls:initialize", {});

      // Note: DockView modal manager is automatically initialized when the modal plugin is loaded
      // No explicit initialization needed

      // Note: Tour controller initialization is moved to after panel creation
      // to ensure the engine panel exists when the tour controller starts
    } catch (error) {
      throw new Error(
        `Manager initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Initializes the tour controller after panels are created
   * @throws {Error} If tour controller fails to initialize (non-critical)
   */
  public static async initializeTourController(
    pluginManagerInstance: typeof pluginManager,
    dockviewController: any,
  ): Promise<void> {
    // Initialize tour controller (optional - shouldn't block startup)
    console.debug("[ManagerInit] Initializing tour controller...");
    try {
      await pluginManagerInstance.execute("tour:initialize", {
        dockviewController,
      });
    } catch (error) {
      console.warn(
        "[ManagerInit] Tour controller initialization failed (non-critical):",
        error,
      );
      // Tour is optional, don't let this block the app
    }
  }
}
