import { pluginManager } from "@teskooano/ui-plugin";
import type { DockviewApi } from "dockview-core";

import { EnvironmentValidator } from "../validation/EnvironmentValidator";
import { ManagerInitializer } from "./ManagerInitializer";
import { PanelRegistry } from "./PanelRegistry";
import { EventSetup } from "./EventSetup";

interface AppContext {
  modalManager?: any;
  dockviewController?: any;
}

interface InitializationResult {
  dockviewController: any;
  dockviewApi: DockviewApi;
  appContext: AppContext;
}

/**
 * Orchestrates the complete application initialization process
 */
export class ApplicationInitializer {
  /**
   * Runs the complete application initialization sequence
   * @throws {Error} If any critical initialization step fails
   */
  public static async initialize(
    pluginIds: string[]
  ): Promise<InitializationResult> {
    console.log("🔭 Initializing Teskooano...");

    try {
      // Step 1: Validate environment
      console.log("[Init] Validating environment...");
      const { appElement, toolbarElement } = EnvironmentValidator.validateRequiredElements();

      // Step 2: Load and register plugins
      console.log("[Init] Loading plugins...");
      await this.loadPlugins(pluginIds);

      // Step 3: Initialize dockview system
      console.log("[Init] Initializing dockview system...");
      const { dockviewController, dockviewApi } = await this.initializeDockview(appElement);

      // Step 4: Set plugin manager dependencies
      console.log("[Init] Setting plugin dependencies...");
      pluginManager.setAppDependencies({
        dockviewApi,
        dockviewController,
      });

      // Step 5: Initialize application managers
      console.log("[Init] Initializing application managers...");
      const { modalManager } = await ManagerInitializer.initializeManagers(
        pluginManager,
        appElement,
        toolbarElement,
        dockviewController
      );

      // Step 6: Register panel components
      console.log("[Init] Registering panel components...");
      PanelRegistry.registerPanelComponents(pluginManager, dockviewController);

      // Step 7: Create initial panels
      console.log("[Init] Creating initial panels...");
      await this.createInitialPanels(dockviewController);

      // Step 8: Setup event listeners
      console.log("[Init] Setting up event listeners...");
      const appContext: AppContext = {
        dockviewController,
        modalManager,
      };
      EventSetup.setupEventListeners(pluginManager, appContext);

      console.log("🪐 Teskooano Initialized.");

      return {
        dockviewController,
        dockviewApi,
        appContext,
      };
    } catch (error) {
      console.error("💥 Critical initialization failure:", error);
      
      // Attempt cleanup
      await this.cleanup();
      
      throw new Error(
        `Application initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Initializes the dockview system
   */
  private static async initializeDockview(
    appElement: HTMLElement
  ): Promise<{ dockviewController: any; dockviewApi: DockviewApi }> {
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
      console.error("[ApplicationInitializer] Error calling dockview:initialize function:", error);
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
        `Failed to load plugins: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Creates initial application panels
   */
  private static async createInitialPanels(dockviewController: any): Promise<void> {
    try {
      await pluginManager.execute("view:addCompositeEnginePanel", {
        dockviewController,
      });
    } catch (error) {
      throw new Error(
        `Failed to create initial panels: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Attempts to clean up any resources that may have been initialized
   */
  private static async cleanup(): Promise<void> {
    try {
      console.log("[Init] Attempting cleanup...");
      
      // Clear any plugin manager state
      // Note: pluginManager might not have a cleanup method, so we wrap in try-catch
      if (typeof (pluginManager as any).cleanup === 'function') {
        await (pluginManager as any).cleanup();
      }
      
      // Clear any global context
      if (typeof window !== 'undefined') {
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
}