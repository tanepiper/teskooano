import { simulationState$, type SimulationState } from "@teskooano/core-state";
import { Subscription } from "rxjs";
import { layoutOrientation$ } from "../../state";

interface PanelEventManagerOptions {
  panelIsConnected: () => boolean;
  triggerResize: () => void;
  handleSimulationStateChange: (state: SimulationState) => void;
}

/**
 * Manages general event subscriptions for the CompositeEnginePanel, including
 * global state, layout changes, and window-level custom events.
 */
export class PanelEventManager {
  private _options: PanelEventManagerOptions;
  private _subscription = new Subscription();

  constructor(options: PanelEventManagerOptions) {
    this._options = options;
  }

  /**
   * Sets up all event listeners and returns a subscription that can be
   * used to tear them all down.
   */
  public listen(): void {
    // Subscribe to simulation state
    this._subscription.add(
      simulationState$.subscribe(this._options.handleSimulationStateChange),
    );

    // Subscribe to layout changes
    this._subscription.add(
      layoutOrientation$.subscribe(() => {
        if (this._options.panelIsConnected()) {
          this._options.triggerResize();
        }
      }),
    );
  }

  public dispose(): void {
    this._subscription.unsubscribe();
  }
}
