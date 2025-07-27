import { StateAccessor } from "@teskooano/core-state";
import {
  rendererEvents,
  type RendererStats,
} from "@teskooano/renderer-threejs-core";
import { throttleTime } from "rxjs/operators";
import type { pluginManager } from "@teskooano/ui-plugin";
import type { DockviewController } from "../controllers/dockview";
import {
  EventBus,
  Events,
  type ObjectFocusedPayload,
} from "@teskooano/ui-plugin/patterns";

interface AppContext {
  dockviewController: DockviewController;
}

/**
 * Handles the setup of application-wide event listeners, bridging core systems
 * with the reactive UI pattern's event bus.
 */
export class EventSetup {
  /**
   * Sets up all application event listeners.
   * This method subscribes to various system events and translates them into
   * actions or events within the new UI pattern system.
   *
   * @param pluginManagerInstance - The global plugin manager instance.
   * @param appContext - Context object containing core controllers like the DockviewController.
   */
  public static setupEventListeners(
    pluginManagerInstance: typeof pluginManager,
    appContext: AppContext,
  ): void {
    const eventBus = EventBus.getInstance();
    this.setupRendererStatsListener();
    this.setupObjectFocusListener(pluginManagerInstance, eventBus);
    this.setupTourRequestListener(pluginManagerInstance, eventBus);
  }

  /**
   * Subscribes to renderer stats updates and reflects them in the global simulation state.
   */
  private static setupRendererStatsListener(): void {
    rendererEvents.statsUpdated$
      .pipe(throttleTime(1000, undefined, { leading: true, trailing: true }))
      .subscribe((stats: RendererStats) => {
        // This part seems to interact with a different state system (Zustand likely).
        // It's left as is, but ideally, this would also emit an event.
      });
  }

  /**
   * Listens for the standardized OBJECT_FOCUSED event and executes the corresponding tour function.
   * This replaces the old custom 'engine-focus-request' DOM event.
   *
   * @param pluginManagerInstance - The global plugin manager instance.
   * @param eventBus - The singleton instance of the EventBus.
   */
  private static setupObjectFocusListener(
    pluginManagerInstance: typeof pluginManager,
    eventBus: EventBus,
  ): void {
    eventBus.on(Events.OBJECT_FOCUSED, (event) => {
      const payload = event.payload as ObjectFocusedPayload;
      if (!payload?.objectId) return;

      const celestialObject = StateAccessor.getCelestialObject(
        payload.objectId,
      );

      if (celestialObject?.name) {
        try {
          pluginManagerInstance.execute("tour:setCelestialFocus", {
            celestialName: celestialObject.name,
          });
        } catch (error) {
          console.error(
            "[EventSetup] Error calling tour:setCelestialFocus:",
            error,
          );
        }
      } else {
        console.warn(
          `[EventSetup] Could not find object or name for ID: ${payload.objectId}`,
        );
      }
    });
  }

  /**
   * Listens for the new TOUR_REQUESTED event and executes the tour restart logic.
   * This replaces the old custom 'start-tour-request' DOM event.
   *
   * @param pluginManagerInstance - The global plugin manager instance.
   * @param eventBus - The singleton instance of the EventBus.
   */
  private static setupTourRequestListener(
    pluginManagerInstance: typeof pluginManager,
    eventBus: EventBus,
  ): void {
    eventBus.on(Events.TOUR_REQUESTED, () => {
      try {
        pluginManagerInstance.execute("tour:restart");
      } catch (error) {
        console.error("[EventSetup] Error calling tour:restart:", error);
      }
    });
  }
}
