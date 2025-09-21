import { Subject } from "rxjs";
import { CustomEvents } from "@teskooano/data-types";
import { celestialStore } from "../stores/CelestialStore";
import type { CelestialObject } from "@teskooano/data-types";

/**
 * System EventBridge service that connects DOM events from core state to RxJS events for system-level operations.
 *
 * This service handles system-level events like:
 * - Object lifecycle (add/remove/update at system level)
 * - Hierarchy changes (parent/child relationships)
 * - System state changes (time scale, pause, etc.)
 * - System-wide operations (clear state, load systems, etc.)
 */
export class SystemEventBridge {
  private static instance: SystemEventBridge | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Gets the singleton instance of SystemEventBridge.
   */
  public static getInstance(): SystemEventBridge {
    if (!SystemEventBridge.instance) {
      SystemEventBridge.instance = new SystemEventBridge();
    }
    return SystemEventBridge.instance;
  }

  /**
   * Initializes the event bridge by setting up DOM event listeners.
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn("[SystemEventBridge] Already initialized");
      return;
    }

    // Listen for system-level DOM events
    document.addEventListener(
      CustomEvents.CELESTIAL_OBJECT_DESTROYED,
      this.handleCelestialObjectDestroyed,
    );
    document.addEventListener(
      CustomEvents.CELESTIAL_OBJECTS_LOADED,
      this.handleCelestialObjectsLoaded,
    );

    this.isInitialized = true;
    console.log("[SystemEventBridge] Initialized");
  }

  /**
   * Disposes of the event bridge by removing DOM event listeners.
   */
  public dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    document.removeEventListener(
      CustomEvents.CELESTIAL_OBJECT_DESTROYED,
      this.handleCelestialObjectDestroyed,
    );
    document.removeEventListener(
      CustomEvents.CELESTIAL_OBJECTS_LOADED,
      this.handleCelestialObjectsLoaded,
    );

    this.isInitialized = false;
    console.log("[SystemEventBridge] Disposed");
  }

  /**
   * Handles celestial object destroyed events from the core state system.
   */
  private handleCelestialObjectDestroyed = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { objectId } = customEvent.detail;

    if (!objectId) {
      console.warn(
        "[SystemEventBridge] Received CELESTIAL_OBJECT_DESTROYED event without objectId",
      );
      return;
    }

    // Get the destroyed object from the store
    const destroyedObject = celestialStore.getObject(objectId);
    if (!destroyedObject) {
      console.warn(
        `[SystemEventBridge] Destroyed object ${objectId} not found in store`,
      );
      return;
    }

    // Emit RxJS event for system-level destruction
    this.celestialObjectDestroyed$.next({
      object: destroyedObject,
      objectId,
      timestamp: Date.now(),
    });
  };

  /**
   * Handles celestial objects loaded events from the core state system.
   */
  private handleCelestialObjectsLoaded = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { count, systemId } = customEvent.detail;

    // Emit RxJS event for system-level loading
    this.celestialObjectsLoaded$.next({
      count: count || 0,
      systemId,
      timestamp: Date.now(),
    });
  };

  // RxJS event subjects for system-level operations
  public readonly celestialObjectDestroyed$ = new Subject<{
    object: CelestialObject;
    objectId: string;
    timestamp: number;
  }>();

  public readonly celestialObjectsLoaded$ = new Subject<{
    count: number;
    systemId?: string;
    timestamp: number;
  }>();
}
