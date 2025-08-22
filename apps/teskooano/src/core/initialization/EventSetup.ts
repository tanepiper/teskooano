import { StateAccessor } from "@teskooano/core-state";
import type { pluginManager } from "@teskooano/ui-plugin";
import {
  EventBus,
  Events,
  type ObjectFocusedPayload,
} from "@teskooano/ui-plugin/patterns";
import type { DockviewController } from "../controllers/dockview";

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
    _appContext: AppContext,
  ): void {
    const eventBus = EventBus.getInstance();

    this.setupObjectFocusListener(pluginManagerInstance, eventBus);
    this.setupTourRequestListener(pluginManagerInstance, eventBus);
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
