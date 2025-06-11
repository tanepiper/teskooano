import { celestialObjects$ } from "@teskooano/core-state";
import { simulationManager } from "@teskooano/app-simulation";
import { CustomEvents } from "@teskooano/data-types";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { Subscription } from "rxjs";
import type { PlaceholderManager } from "../../placeholder-manager";

interface PanelLifecycleManagerOptions {
  getIsConnected: () => boolean;
  getRenderer: () => ModularSpaceRenderer | undefined;
  placeholderManager: PlaceholderManager | undefined;
  initializeRendererAndUI: () => void;
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

  constructor(options: PanelLifecycleManagerOptions) {
    this._options = options;
    this._handleSystemGenerationStart =
      this._handleSystemGenerationStart.bind(this);
    this._handleSystemGenerationComplete =
      this._handleSystemGenerationComplete.bind(this);
  }

  private _handleSystemGenerationStart = (): void => {
    if (!this._options.getIsConnected()) return;
    this._isGeneratingSystem = true;
    // Only show progress if the renderer isn't already active.
    if (!this._options.getRenderer()) {
      this._options.placeholderManager?.showMessage(true);
    }
  };

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
  public listen(): Subscription {
    if (!this._subscription.closed) {
      this.dispose();
    }
    this._subscription = new Subscription();

    this._subscription.add(
      celestialObjects$.subscribe((celestialObjects) => {
        if (!this._options.getIsConnected()) return;

        const hasObjects = Object.keys(celestialObjects).length > 0;
        const hasRenderer = !!this._options.getRenderer();

        if (hasObjects && !hasRenderer) {
          // If objects exist but we have no renderer, create it.
          this._options.placeholderManager?.hide();
          this._options.initializeRendererAndUI();
          simulationManager.startLoop();
        } else if (!hasObjects && hasRenderer) {
          // If no objects exist but we have a renderer, tear it down.
          this._options.disposeRendererAndUI();
          simulationManager.resetSystem(true);
          this._options.placeholderManager?.showMessage(false);
        } else if (!hasObjects && !hasRenderer && !this._isGeneratingSystem) {
          // Handle initial state or after a clear when no new system is generating
          this._options.placeholderManager?.showMessage(false);
        }
      }),
    );

    window.addEventListener(
      CustomEvents.SYSTEM_GENERATION_START,
      this._handleSystemGenerationStart,
    );
    window.addEventListener(
      CustomEvents.SYSTEM_GENERATION_COMPLETE,
      this._handleSystemGenerationComplete,
    );

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

    return this._subscription;
  }

  /**
   * Disposes of the manager's subscriptions.
   */
  public dispose(): void {
    this._subscription.unsubscribe();
  }
}
