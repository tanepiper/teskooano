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
   */
  public static async initialize(
    pluginIds: string[]
  ): Promise<InitializationResult> {
    console.log("🔭 Initializing Teskooano...");

    // Step 1: Validate environment
    const { appElement, toolbarElement } = EnvironmentValidator.validateRequiredElements();

    // Step 2: Load and register plugins
    await pluginManager.loadAndRegisterPlugins(pluginIds);

    // Step 3: Initialize dockview system
    const { dockviewController, dockviewApi } = await this.initializeDockview(appElement);

    // Step 4: Set plugin manager dependencies
    pluginManager.setAppDependencies({
      dockviewApi,
      dockviewController,
    });

    // Step 5: Initialize application managers
    const { modalManager } = await ManagerInitializer.initializeManagers(
      pluginManager,
      appElement,
      toolbarElement,
      dockviewController
    );

    // Step 6: Register panel components
    PanelRegistry.registerPanelComponents(pluginManager, dockviewController);

    // Step 7: Create initial panels
    await this.createInitialPanels(dockviewController);

    // Step 8: Setup event listeners
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
   * Creates initial application panels
   */
  private static async createInitialPanels(dockviewController: any): Promise<void> {
    try {
      await pluginManager.execute("view:addCompositeEnginePanel", {
        dockviewController,
      });
    } catch (error) {
      console.error(
        "[ApplicationInitializer] Error calling view:addCompositeEnginePanel function on startup:",
        error
      );
    }
  }
}