import { Subject } from "rxjs";
import { CustomEvents } from "@teskooano/data-types";

/**
 * Celestial EventBridge service that connects DOM events from UI components to RxJS events for celestial-specific operations.
 *
 * This service handles celestial-specific events like:
 * - Show/hide labels, orbits, predictions
 * - Focus/follow operations
 * - Camera transitions
 * - Celestial-specific UI interactions
 */
export class CelestialEventBridge {
  private static instance: CelestialEventBridge | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Gets the singleton instance of CelestialEventBridge.
   */
  public static getInstance(): CelestialEventBridge {
    if (!CelestialEventBridge.instance) {
      CelestialEventBridge.instance = new CelestialEventBridge();
    }
    return CelestialEventBridge.instance;
  }

  /**
   * Initializes the event bridge by setting up DOM event listeners.
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn("[CelestialEventBridge] Already initialized");
      return;
    }

    // Listen for celestial-specific DOM events
    document.addEventListener(
      "teskooano-clear-orbit-trails",
      this.handleClearOrbitTrails,
    );
    document.addEventListener(
      "teskooano-clear-predictions",
      this.handleClearPredictions,
    );
    document.addEventListener(
      "teskooano-toggle-labels",
      this.handleToggleLabels,
    );
    document.addEventListener(
      "teskooano-toggle-orbits",
      this.handleToggleOrbits,
    );
    document.addEventListener("teskooano-focus-object", this.handleFocusObject);
    document.addEventListener(
      "teskooano-follow-object",
      this.handleFollowObject,
    );

    this.isInitialized = true;
    console.log("[CelestialEventBridge] Initialized");
  }

  /**
   * Disposes of the event bridge by removing DOM event listeners.
   */
  public dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    document.removeEventListener(
      "teskooano-clear-orbit-trails",
      this.handleClearOrbitTrails,
    );
    document.removeEventListener(
      "teskooano-clear-predictions",
      this.handleClearPredictions,
    );
    document.removeEventListener(
      "teskooano-toggle-labels",
      this.handleToggleLabels,
    );
    document.removeEventListener(
      "teskooano-toggle-orbits",
      this.handleToggleOrbits,
    );
    document.removeEventListener(
      "teskooano-focus-object",
      this.handleFocusObject,
    );
    document.removeEventListener(
      "teskooano-follow-object",
      this.handleFollowObject,
    );

    this.isInitialized = false;
    console.log("[CelestialEventBridge] Disposed");
  }

  /**
   * Handles clear orbit trails events.
   */
  private handleClearOrbitTrails = (event: Event): void => {
    this.clearOrbitTrails$.next({
      timestamp: Date.now(),
    });
  };

  /**
   * Handles clear predictions events.
   */
  private handleClearPredictions = (event: Event): void => {
    this.clearPredictions$.next({
      timestamp: Date.now(),
    });
  };

  /**
   * Handles toggle labels events.
   */
  private handleToggleLabels = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { objectId, visible } = customEvent.detail || {};

    this.toggleLabels$.next({
      objectId,
      visible,
      timestamp: Date.now(),
    });
  };

  /**
   * Handles toggle orbits events.
   */
  private handleToggleOrbits = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { objectId, visible } = customEvent.detail || {};

    this.toggleOrbits$.next({
      objectId,
      visible,
      timestamp: Date.now(),
    });
  };

  /**
   * Handles focus object events.
   */
  private handleFocusObject = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { objectId } = customEvent.detail || {};

    this.focusObject$.next({
      objectId,
      timestamp: Date.now(),
    });
  };

  /**
   * Handles follow object events.
   */
  private handleFollowObject = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { objectId } = customEvent.detail || {};

    this.followObject$.next({
      objectId,
      timestamp: Date.now(),
    });
  };

  // RxJS event subjects for celestial-specific operations
  public readonly clearOrbitTrails$ = new Subject<{
    timestamp: number;
  }>();

  public readonly clearPredictions$ = new Subject<{
    timestamp: number;
  }>();

  public readonly toggleLabels$ = new Subject<{
    objectId?: string;
    visible?: boolean;
    timestamp: number;
  }>();

  public readonly toggleOrbits$ = new Subject<{
    objectId?: string;
    visible?: boolean;
    timestamp: number;
  }>();

  public readonly focusObject$ = new Subject<{
    objectId?: string;
    timestamp: number;
  }>();

  public readonly followObject$ = new Subject<{
    objectId?: string;
    timestamp: number;
  }>();
}
