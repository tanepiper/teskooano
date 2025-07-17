import { StateAccessor } from "@teskooano/core-state";
import { simulationManager } from "@teskooano/app-simulation";
import { CustomEvents } from "@teskooano/data-types";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { Subscription } from "rxjs";
import type { PlaceholderManager } from "../../placeholder-manager";

/**
 * Options for the PanelLifecycleManager.
 */
export interface PanelLifecycleManagerOptions {
  /**
   * Checks if the panel is connected to the DOM.
   * @returns True if the panel is connected, false otherwise.
   */
  getIsConnected: () => boolean;
  /**
   * Gets the renderer.
   * @returns The renderer or undefined if not initialized.
   */
  getRenderer: () => ModularSpaceRenderer | undefined;
  /**
   * The placeholder manager to use.
   */
  placeholderManager: PlaceholderManager | undefined;
  /**
   * Initializes the renderer and UI.
   */
  initializeRendererAndUI: () => void;
  /**
   * Disposes of the renderer and UI.
   */
  disposeRendererAndUI: () => void;
}

/**
 * Manages the core lifecycle of a CompositeEnginePanel's internal components
 * (renderer, UI) by subscribing to the global celestial objects state.
 *
 * It orchestrates the creation and destruction of the renderer and associated UI
 * based on whether there are celestial objects to display. It also listens for
 * system generation events to provide feedback to the user (e.g., loading indicators).
 */
export class PanelLifecycleManager {
  private _subscription = new Subscription();
  private _options: PanelLifecycleManagerOptions;
  private _isGeneratingSystem = false;
  private _clearTimeout: number | null = null;

  constructor(options: PanelLifecycleManagerOptions) {
    this._options = options;
    this._handleSystemGenerationStart =
      this._handleSystemGenerationStart.bind(this);
    this._handleSystemGenerationComplete =
      this._handleSystemGenerationComplete.bind(this);
  }

  /**
   * Handles the system generation start event.
   */
  private _handleSystemGenerationStart = (): void => {
    if (!this._options.getIsConnected()) return;
    this._isGeneratingSystem = true;
    // Only show progress if the renderer isn't already active.
    if (!this._options.getRenderer()) {
      this._options.placeholderManager?.showMessage(true);
    }
  };

  /**
   * Handles the system generation complete event.
   */
  private _handleSystemGenerationComplete = (): void => {
    if (!this._options.getIsConnected()) return;
    this._isGeneratingSystem = false;
    // The celestialObjects$ subscription is the source of truth for what to
    // display next, so we just update the flag here. If no objects were
    // generated, the subscription will handle showing the placeholder.
  };

  /**
   * Starts listening to the `celestialObjects$` stream and manages the panel's
   * lifecycle accordingly.
   */
  public listen(): void {
    if (!this._subscription.closed) {
      this.dispose();
    }
    this._subscription = new Subscription();

    this._subscription.add(
      StateAccessor.getCelestialObjectsStream().subscribe(
        (celestialObjects) => {
          if (!this._options.getIsConnected()) return;

          const hasObjects = Object.keys(celestialObjects).length > 0;
          const rendererExists = !!this._options.getRenderer();

          if (hasObjects) {
            // If we have objects, ensure the renderer is up and placeholder is hidden.
            // Cancel any pending renderer disposal timeout
            if (this._clearTimeout) {
              clearTimeout(this._clearTimeout);
              this._clearTimeout = null;
            }

            if (!rendererExists) {
              this._options.initializeRendererAndUI();
              simulationManager.startLoop();
            }
            this._options.placeholderManager?.hide();
          } else {
            // If we have no objects, wait a bit before disposing the renderer
            // to avoid disposing it during system loading operations
            if (rendererExists) {
              // Clear any existing timeout
              if (this._clearTimeout) {
                clearTimeout(this._clearTimeout);
              }

              // Set a timeout to dispose the renderer after a short delay
              // This prevents disposing during rapid state changes (like system loading)
              this._clearTimeout = window.setTimeout(() => {
                this._options.disposeRendererAndUI();
                // Don't call resetSystem here as it might interfere with the state
                // simulationManager.resetSystem(true);
                this._clearTimeout = null;
              }, 100); // 100ms delay
            }
            if (!this._isGeneratingSystem) {
              this._options.placeholderManager?.showMessage(false);
            }
          }
        },
      ),
    );

    // Add event listeners for system generation start and complete.
    window.addEventListener(
      CustomEvents.SYSTEM_GENERATION_START,
      this._handleSystemGenerationStart,
    );
    window.addEventListener(
      CustomEvents.SYSTEM_GENERATION_COMPLETE,
      this._handleSystemGenerationComplete,
    );

    // Remove event listeners when the manager is disposed.
    this._subscription.add(() => {
      window.removeEventListener(
        CustomEvents.SYSTEM_GENERATION_START,
        this._handleSystemGenerationStart,
      );
      window.removeEventListener(
        CustomEvents.SYSTEM_GENERATION_COMPLETE,
        this._handleSystemGenerationComplete,
      );
    });
  }

  /**
   * Disposes of the manager's subscriptions.
   */
  public dispose(): void {
    this._subscription.unsubscribe();

    // Clear any pending timeout
    if (this._clearTimeout) {
      clearTimeout(this._clearTimeout);
      this._clearTimeout = null;
    }
  }
}
