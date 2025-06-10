import { simulationState$, type SimulationState } from "@teskooano/core-state";
import { CustomEvents } from "@teskooano/data-types";
import { Subscription } from "rxjs";
import { layoutOrientation$ } from "../../state";

interface PanelEventManagerOptions {
  panelIsConnected: () => boolean;
  triggerResize: () => void;
  handleSimulationStateChange: (state: SimulationState) => void;
  handleSystemGenerationStart: () => void;
  handleSystemGenerationComplete: () => void;
}

/**
 * Manages general event subscriptions for the CompositeEnginePanel, including
 * global state, layout changes, and window-level custom events.
 */
export class PanelEventManager {
  private _options: PanelEventManagerOptions;

  constructor(options: PanelEventManagerOptions) {
    this._options = options;
  }

  /**
   * Sets up all event listeners and returns a subscription that can be
   * used to tear them all down.
   */
  public listen(): Subscription {
    const subscription = new Subscription();

    // Subscribe to simulation state
    subscription.add(
      simulationState$.subscribe(this._options.handleSimulationStateChange),
    );

    // Subscribe to layout changes
    subscription.add(
      layoutOrientation$.subscribe(() => {
        if (this._options.panelIsConnected()) {
          this._options.triggerResize();
        }
      }),
    );

    // Bind for adding/removing listeners
    const boundGenStart = this._options.handleSystemGenerationStart;
    const boundGenComplete = this._options.handleSystemGenerationComplete;

    // Subscribe to global events
    window.addEventListener(
      CustomEvents.SYSTEM_GENERATION_START,
      boundGenStart,
    );
    window.addEventListener(
      CustomEvents.SYSTEM_GENERATION_COMPLETE,
      boundGenComplete,
    );

    // Add a cleanup function to the subscription for the window event listeners
    subscription.add(() => {
      window.removeEventListener(
        CustomEvents.SYSTEM_GENERATION_START,
        boundGenStart,
      );
      window.removeEventListener(
        CustomEvents.SYSTEM_GENERATION_COMPLETE,
        boundGenComplete,
      );
    });

    return subscription;
  }
}
