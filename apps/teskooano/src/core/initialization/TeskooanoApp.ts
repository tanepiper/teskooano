import { pluginManager } from "@teskooano/ui-plugin";
import type { DockviewApi } from "dockview-core";
import { PerformanceMonitor } from "@teskooano/renderer-threejs-celestial";

import { EnvironmentValidator } from "../validation/EnvironmentValidator";
import { ManagerInitializer } from "./ManagerInitializer";
import { PanelRegistry } from "./PanelRegistry";
import { EventSetup } from "./EventSetup";
import { SimulationLoopManager } from "../state/SimulationLoopManager";
import { DockviewController, OverlayManager } from "../controllers/dockview";

/**
 * The main Teskooano application class that orchestrates the complete initialization process
 * and provides access to all core application components.
 */
export class TeskooanoApp {
  public readonly dockviewController: DockviewController;
  public readonly dockviewApi: DockviewApi;
  public readonly simulationLoopManager: SimulationLoopManager;
  public readonly performanceMonitor: PerformanceMonitor;
  public readonly modalManager: OverlayManager;

  private constructor(
    dockviewController: DockviewController,
    dockviewApi: DockviewApi,
    simulationLoopManager: SimulationLoopManager,
    performanceMonitor: PerformanceMonitor,
    modalManager: OverlayManager,
  ) {
    this.dockviewController = dockviewController;
    this.dockviewApi = dockviewApi;
    this.simulationLoopManager = simulationLoopManager;
    this.performanceMonitor = performanceMonitor;
    this.modalManager = modalManager;
  }

  /**
   * Creates and initializes a new TeskooanoApp instance.
   * @param pluginIds Array of plugin IDs to load
   * @returns A fully initialized TeskooanoApp instance
   * @throws {Error} If any critical initialization step fails
   */
  public static async create(pluginIds: string[]): Promise<TeskooanoApp> {
    console.log("🔭 Initializing Teskooano...");

    try {
      // Step 1: Validate environment
      console.debug("[Init] Validating environment...");
      const { appElement, toolbarElement } =
        EnvironmentValidator.validateRequiredElements();

      // Step 2: Load and register plugins
      console.debug("[Init] Loading plugins...");
      await TeskooanoApp.loadPlugins(pluginIds);

      // Step 2.5: Initialize performance monitoring (but don't start monitoring yet)
      console.debug("[Init] Initializing performance monitoring...");
      const performanceMonitor = PerformanceMonitor.getInstance();

      // Step 3: Initialize dockview system
      console.debug("[Init] Initializing dockview system...");
      const { dockviewController, dockviewApi } =
        await TeskooanoApp.initializeDockview(appElement);

      // Step 4: Set plugin manager dependencies
      console.debug("[Init] Setting plugin dependencies...");
      pluginManager.setAppDependencies({
        dockviewApi,
        dockviewController,
      });

      // Step 5: Register panel components (must happen before managers that use panels)
      console.debug("[Init] Registering panel components...");
      PanelRegistry.registerPanelComponents(pluginManager, dockviewController);

      // Step 6: Initialize modal manager
      console.debug("[Init] Initializing modal manager...");
      const modalManager =
        await TeskooanoApp.initializeModalManager(appElement);

      // Step 7: Initialize application managers
      console.debug("[Init] Initializing application managers...");
      await ManagerInitializer.initializeManagers(
        pluginManager,
        appElement,
        toolbarElement,
        dockviewController,
        modalManager,
      );

      // Step 8: Create initial panels
      console.debug("[Init] Creating initial panels...");
      await TeskooanoApp.createInitialPanels(dockviewController);

      // Step 8.5: Initialize tour controller (after panels are created)
      console.debug("[Init] Initializing tour controller...");
      await ManagerInitializer.initializeTourController(
        pluginManager,
        dockviewController,
      );

      // Step 9: Initialize simulation loop manager
      console.debug("[Init] Initializing simulation loop manager...");
      const simulationLoopManager = new SimulationLoopManager();

      // Step 10: Setup event listeners
      console.debug("[Init] Setting up event listeners...");
      EventSetup.setupEventListeners(pluginManager, { dockviewController });

      console.log("🪐 Teskooano Initialized.");

      // Hide the loading screen
      const loadingElement = document.getElementById("loading");
      if (loadingElement) {
        loadingElement.remove();
      }

      return new TeskooanoApp(
        dockviewController,
        dockviewApi,
        simulationLoopManager,
        performanceMonitor,
        modalManager,
      );
    } catch (error) {
      console.error("💥 Critical initialization failure:", error);

      // Display an error message to the user
      const loadingElement = document.getElementById("loading");
      if (loadingElement) {
        loadingElement.innerHTML = `
          <div style="text-align: center; font-family: sans-serif; color: #E0E0E0;">
              <h2>Application Error</h2>
              <p>Could not initialize the simulation.</p>
              <p style="color: #EF5350; font-family: monospace; max-width: 80vw; margin: auto; word-wrap: break-word;">${
                error instanceof Error ? error.message : "Unknown error"
              }</p>
              <p><small>Please check the developer console for more details.</small></p>
          </div>
      `;
      }

      // Attempt cleanup
      await TeskooanoApp.cleanup();

      throw new Error(
        `Application initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Initializes the dockview system
   */
  private static async initializeDockview(appElement: HTMLElement): Promise<{
    dockviewController: DockviewController;
    dockviewApi: DockviewApi;
  }> {
    // Set initial null dependencies
    pluginManager.setAppDependencies({
      dockviewApi: null as any,
      dockviewController: null,
    });

    try {
      const result: any = await pluginManager.execute("dockview:initialize", {
        appElement,
      });

      if (
        result &&
        typeof result === "object" &&
        "controller" in result &&
        "api" in result
      ) {
        return {
          dockviewController: result.controller,
          dockviewApi: result.api,
        };
      } else {
        const message =
          result && typeof result === "object" && "message" in result
            ? result.message
            : "Unknown error or unexpected result structure from dockview:initialize";

        throw new Error(`Dockview initialization failed: ${message}`);
      }
    } catch (error) {
      console.error(
        "[TeskooanoApp] Error calling dockview:initialize function:",
        error,
      );
      throw error;
    }
  }

  /**
   * Loads and registers all plugins
   */
  private static async loadPlugins(pluginIds: string[]): Promise<void> {
    try {
      await pluginManager.loadAndRegisterPlugins(pluginIds);
    } catch (error) {
      throw new Error(
        `Failed to load plugins: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Creates initial application panels
   */
  private static async createInitialPanels(
    dockviewController: DockviewController,
  ): Promise<void> {
    try {
      await pluginManager.execute("view:addCompositeEnginePanel", {
        dockviewController,
      });
    } catch (error) {
      throw new Error(
        `Failed to create initial panels: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Initializes the modal manager
   */
  private static async initializeModalManager(
    appElement: HTMLElement,
  ): Promise<OverlayManager> {
    console.debug("[TeskooanoApp] Initializing modal manager...");

    // Create a dedicated OverlayManager for the app using the same container element
    const modalManager = new OverlayManager(appElement);

    return modalManager;
  }

  /**
   * Attempts to clean up any resources that may have been initialized
   */
  private static async cleanup(): Promise<void> {
    try {
      console.log("[Init] Attempting cleanup...");

      // Clear any plugin manager state
      // Note: pluginManager might not have a cleanup method, so we wrap in try-catch
      if (typeof (pluginManager as any).cleanup === "function") {
        await (pluginManager as any).cleanup();
      }

      // Clear any global context
      if (typeof window !== "undefined") {
        // Clear any global event listeners that might have been attached
        // This is defensive programming - most event listeners will be cleaned up
        // when the page reloads, but it's good practice
      }

      console.log("[Init] Cleanup completed");
    } catch (cleanupError) {
      console.warn("[Init] Cleanup failed:", cleanupError);
      // Don't throw here - cleanup failure shouldn't mask the original error
    }
  }

  /**
   * Disposes of the application and cleans up all resources.
   */
  public dispose(): void {
    console.log("[TeskooanoApp] Disposing application...");

    // Dispose simulation loop manager
    this.simulationLoopManager.dispose();

    // Additional cleanup can be added here as needed

    console.log("[TeskooanoApp] Application disposed");
  }
}
