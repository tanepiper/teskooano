import { pluginManager } from "@teskooano/ui-plugin";
import type { DockviewApi } from "dockview-core";
import { PerformanceMonitor } from "@teskooano/renderer-threejs-celestial";

import { EnvironmentValidator } from "./validation";
import { ManagerInitializer } from "../initialization/ManagerInitializer";
import { PanelRegistry } from "../initialization/PanelRegistry";
import { EventSetup } from "../initialization/EventSetup";
import { SimulationLoopManager } from "../state/SimulationLoopManager";
import { DockviewController, OverlayManager } from "../controllers/dockview";
import { TeskooanoAppOptions } from "./types";

/**
 * The main Teskooano application class that orchestrates the complete initialization process
 * and provides access to all core application components.
 */
export class TeskooanoApp {
  /**
   * The dockview controller instance.
   */
  public dockviewController!: DockviewController;
  /**
   * The dockview API instance.
   */
  public dockviewApi!: DockviewApi;
  /**
   * The simulation loop manager instance.
   */
  public simulationLoopManager!: SimulationLoopManager;
  /**
   * The performance monitor instance.
   */
  public performanceMonitor!: PerformanceMonitor;
  /**
   * The modal manager instance.
   */
  public modalManager!: OverlayManager;
  /**
   * The plugin manager instance.
   */
  public pluginManager: typeof pluginManager;

  // Application metadata
  /**
   * The name of the application.
   */
  public appName: string;
  /**
   * The version of the application.
   */
  public version: string;
  /**
   * The git hash of the application.
   */
  public gitHash: string;
  /**
   * The plugin IDs to load.
   */
  public pluginIds: string[];

  /**
   * Whether the application has been started.
   */
  private _isStarted = false;

  /**
   * Creates a new TeskooanoApp instance.
   * @param options - The options for the application.
   */
  constructor(options: TeskooanoAppOptions) {
    // Set application metadata
    this.appName = options.appName || "Teskooano";
    this.version = options.version || "unknown";
    this.gitHash = options.gitHash || "unknown";
    this.pluginIds = options.pluginIds;
    this.pluginManager = pluginManager;
  }

  /**
   * Starts the application initialization process.
   * @returns Promise that resolves when the application is fully initialized
   * @throws {Error} If any critical initialization step fails or if already started
   */
  public async start(): Promise<void> {
    if (this._isStarted) {
      throw new Error("TeskooanoApp has already been started");
    }

    console.log(
      `🔭 Initializing ${this.appName} v${this.version} (${this.gitHash})...`,
    );

    try {
      await this.initialize();
      this._isStarted = true;
    } catch (error) {
      await TeskooanoApp.handleInitializationError(error);
      throw new Error(
        `Application initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Whether the application has been started
   */
  public get isStarted(): boolean {
    return this._isStarted;
  }

  /**
   * Main initialization orchestrator
   */
  private async initialize(): Promise<void> {
    const { appElement, toolbarElement } =
      EnvironmentValidator.validateRequiredElements();

    // Step 2: Plugin System (can run in parallel with performance monitor)
    const [{ dockviewController, dockviewApi }, performanceMonitor] =
      await Promise.all([
        this.initializePluginSystem(this.pluginIds, appElement),
        this.initializePerformanceMonitoring(),
      ]);

    // Update instance properties
    (this as any).dockviewController = dockviewController;
    (this as any).dockviewApi = dockviewApi;
    (this as any).performanceMonitor = performanceMonitor;

    // Step 3: UI Infrastructure (requires dockview)
    const modalManager = await this.setupUIInfrastructure(
      appElement,
      dockviewController,
    );
    this.modalManager = modalManager;

    // Step 4: Application Services (requires UI infrastructure)
    await this.initializeApplicationServices(
      appElement,
      toolbarElement,
      dockviewController,
      modalManager,
    );

    // Step 5: User Interface (requires services)
    await this.createUserInterface(dockviewController);

    // Step 6: Final Setup (requires everything)
    const simulationLoopManager =
      await this.completeInitialization(dockviewController);
    (this as any).simulationLoopManager = simulationLoopManager;

    this.finishInitialization();
  }

  // ================================
  // PHASE 1: Environment & Core Setup
  // ================================

  private setupEnvironment() {
    console.debug("[Init] Validating environment...");
  }

  private async initializePerformanceMonitoring(): Promise<PerformanceMonitor> {
    console.debug("[Init] Initializing performance monitoring...");
    return PerformanceMonitor.getInstance();
  }

  // ================================
  // PHASE 2: Plugin System Setup
  // ================================

  private async initializePluginSystem(
    pluginIds: string[],
    appElement: HTMLElement,
  ) {
    // Load plugins first
    console.debug("[Init] Loading plugins...");
    await this.loadPlugins(pluginIds);

    // Initialize dockview system
    console.debug("[Init] Initializing dockview system...");
    const { dockviewController, dockviewApi } =
      await this.initializeDockview(appElement);

    // Set plugin dependencies
    console.debug("[Init] Setting plugin dependencies...");
    pluginManager.setAppDependencies({
      dockviewApi,
      dockviewController,
    });

    return { dockviewController, dockviewApi };
  }

  private async loadPlugins(pluginIds: string[]): Promise<void> {
    try {
      await pluginManager.loadAndRegisterPlugins(pluginIds);
    } catch (error) {
      throw new Error(
        `Failed to load plugins: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async initializeDockview(appElement: HTMLElement): Promise<{
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

  // ================================
  // PHASE 3: UI Infrastructure
  // ================================

  private async setupUIInfrastructure(
    appElement: HTMLElement,
    dockviewController: DockviewController,
  ): Promise<OverlayManager> {
    // Register panel components first
    console.debug("[Init] Registering panel components...");
    const panelRegistry = new PanelRegistry(pluginManager, dockviewController);
    panelRegistry.registerAllPanels();

    // Initialize modal manager
    console.debug("[Init] Initializing modal manager...");
    return this.initializeModalManager(appElement);
  }

  private async initializeModalManager(
    appElement: HTMLElement,
  ): Promise<OverlayManager> {
    console.debug("[TeskooanoApp] Initializing modal manager...");
    return new OverlayManager(appElement);
  }

  // ================================
  // PHASE 4: Application Services
  // ================================

  private async initializeApplicationServices(
    appElement: HTMLElement,
    toolbarElement: HTMLElement,
    dockviewController: DockviewController,
    modalManager: OverlayManager,
  ): Promise<void> {
    console.debug("[Init] Initializing application managers...");
    await ManagerInitializer.initializeManagers(
      pluginManager,
      appElement,
      toolbarElement,
      dockviewController,
      modalManager,
    );
  }

  // ================================
  // PHASE 5: User Interface Creation
  // ================================

  private async createUserInterface(
    dockviewController: DockviewController,
  ): Promise<void> {
    // Create initial panels first
    console.debug("[Init] Creating initial panels...");
    await this.createInitialPanels(dockviewController);

    // Initialize tour controller after panels exist
    console.debug("[Init] Initializing tour controller...");
    await ManagerInitializer.initializeTourController(
      pluginManager,
      dockviewController,
    );
  }

  private async createInitialPanels(
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

  // ================================
  // PHASE 6: Final Setup
  // ================================

  private async completeInitialization(
    dockviewController: DockviewController,
  ): Promise<SimulationLoopManager> {
    // Initialize simulation loop manager
    console.debug("[Init] Initializing simulation loop manager...");
    const simulationLoopManager = new SimulationLoopManager();

    // Setup event listeners
    console.debug("[Init] Setting up event listeners...");
    EventSetup.setupEventListeners(pluginManager, { dockviewController });

    return simulationLoopManager;
  }

  private finishInitialization(): void {
    // Hide the loading screen
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  // ================================
  // Error Handling & Cleanup
  // ================================

  private static async handleInitializationError(
    error: unknown,
  ): Promise<void> {
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
  }

  private static async cleanup(): Promise<void> {
    try {
      console.log("[Init] Attempting cleanup...");

      // Clear any plugin manager state
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
    if (!this._isStarted) {
      console.warn(
        "[TeskooanoApp] Cannot dispose application that was never started",
      );
      return;
    }

    console.log("[TeskooanoApp] Disposing application...");

    // Dispose simulation loop manager
    this.simulationLoopManager.dispose();

    // Additional cleanup can be added here as needed

    console.log("[TeskooanoApp] Application disposed");
  }
}
