import { celestialObjects$ } from "@teskooano/core-state";
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
 * based on whether there are celestial objects to display.
 */
export class PanelLifecycleManager {
  private _subscription = new Subscription();
  private _options: PanelLifecycleManagerOptions;

  constructor(options: PanelLifecycleManagerOptions) {
    this._options = options;
  }

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
        } else if (!hasObjects && hasRenderer) {
          // If no objects exist but we have a renderer, tear it down.
          this._options.disposeRendererAndUI();
          this._options.placeholderManager?.showMessage(false);
        }
      }),
    );

    return this._subscription;
  }

  /**
   * Disposes of the manager's subscriptions.
   */
  public dispose(): void {
    this._subscription.unsubscribe();
  }
}
