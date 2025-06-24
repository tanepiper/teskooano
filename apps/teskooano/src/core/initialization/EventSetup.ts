import { StateAccessor, simulationStateService } from "@teskooano/core-state";
import {
  rendererEvents,
  type RendererStats,
} from "@teskooano/renderer-threejs-core";
import { throttleTime } from "rxjs/operators";
import type { pluginManager } from "@teskooano/ui-plugin";

interface AppContext {
  modalManager?: any;
  dockviewController?: any;
}

/**
 * Handles setup of application-wide event listeners
 */
export class EventSetup {
  /**
   * Sets up all application event listeners
   * @throws {Error} If critical event setup fails
   */
  public static setupEventListeners(
    pluginManagerInstance: typeof pluginManager,
    appContext: AppContext,
  ): void {
    try {
      this.setupRendererStatsListener();
      this.setupEngineFocusListener(pluginManagerInstance);
      this.setupTourRequestListener(pluginManagerInstance, appContext);
    } catch (error) {
      throw new Error(
        `Event setup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Sets up renderer stats updates
   */
  private static setupRendererStatsListener(): void {
    rendererEvents.statsUpdated$
      .pipe(throttleTime(1000, undefined, { leading: true, trailing: true }))
      .subscribe((stats: RendererStats) => {
        const currentState = simulationStateService.getSimulationState();
        simulationStateService.setSimulationState({
          ...currentState,
          renderer: {
            ...currentState.renderer,
            ...stats,
          },
        });
      });
  }

  /**
   * Sets up engine focus request handling
   */
  private static setupEngineFocusListener(
    pluginManagerInstance: typeof pluginManager,
  ): void {
    document.addEventListener("engine-focus-request", (event: Event) => {
      const focusEvent = event as CustomEvent<{
        targetPanelId: string;
        objectId: string | null;
        distance?: number;
      }>;

      const { objectId } = focusEvent.detail;
      if (!objectId) return;

      const objects = StateAccessor.getCurrentCelestialObjects();
      const selectedObject = objects[objectId];

      if (selectedObject && selectedObject.name) {
        try {
          pluginManagerInstance.execute("tour:setCelestialFocus", {
            celestialName: selectedObject.name,
          });
        } catch (error) {
          console.error(
            "[EventSetup] Error calling tour:setCelestialFocus:",
            error,
          );
        }
      } else {
        console.warn(
          `[EventSetup] Could not find object or name for ID: ${objectId}`,
        );
      }
    });
  }

  /**
   * Sets up tour restart request handling
   */
  private static setupTourRequestListener(
    pluginManagerInstance: typeof pluginManager,
    appContext: AppContext,
  ): void {
    document.body.addEventListener("start-tour-request", () => {
      try {
        pluginManagerInstance.execute("tour:restart", {
          modalManager: appContext.modalManager,
        });
      } catch (error) {
        console.error("[EventSetup] Error calling tour:restart:", error);
      }
    });
  }
}
