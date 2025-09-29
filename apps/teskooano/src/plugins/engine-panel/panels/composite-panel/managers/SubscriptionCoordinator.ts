import {
  StateSubscriptionMixin,
  StateAccessor,
  simulationState$,
  type SimulationState,
} from "@teskooano/core-state";
import { LayoutStore } from "../../state/layoutStore";

/**
 * Simple coordinator for managing RxJS subscriptions in the CompositeEnginePanel.
 * Handles all state subscriptions and provides callbacks for state changes.
 * Focused on core functionality without over-engineering.
 */
export class SubscriptionCoordinator {
  private _subscriptionManager = new StateSubscriptionMixin();
  private _clearTimeout: number | null = null;
  private _layoutStore: LayoutStore;

  constructor(
    private readonly callbacks: {
      onCelestialObjectsChange: (celestialObjects: Record<string, any>) => void;
      onSimulationStateChange: (state: SimulationState) => void;
      onLayoutChange: () => void;
      onRendererDisposal: () => void;
    },
  ) {
    this._layoutStore = new LayoutStore();
  }

  /**
   * Setup all subscriptions
   */
  public setupSubscriptions(): void {
    this._subscriptionManager.dispose();
    this._subscriptionManager = new StateSubscriptionMixin();

    // Manage renderer lifecycle based on celestial objects
    this._subscriptionManager.subscribeToStateComposition(
      StateAccessor.celestialObjects$(),
      (celestialObjects: Record<string, any>) => {
        const hasObjects = Object.keys(celestialObjects).length > 0;

        if (hasObjects) {
          // Clear any pending disposal
          this.clearTimeout();
          // Notify that we have objects and need renderer
          this.callbacks.onCelestialObjectsChange(celestialObjects);
        } else {
          // Schedule renderer disposal on next frame
          this.scheduleRendererDisposal();
        }
      },
    );

    // Subscribe to simulation state
    this._subscriptionManager.subscribeToStateComposition(
      simulationState$,
      (state: SimulationState) => {
        this.callbacks.onSimulationStateChange(state);
      },
    );

    // Subscribe to layout changes
    this._subscriptionManager.subscribeToStateComposition(
      this._layoutStore.layoutState$,
      () => {
        this.callbacks.onLayoutChange();
      },
    );
  }

  /**
   * Schedule renderer disposal on next animation frame
   */
  private scheduleRendererDisposal(): void {
    this.clearTimeout();

    // Use requestAnimationFrame instead of setTimeout for better performance
    this._clearTimeout = requestAnimationFrame(() => {
      this.callbacks.onRendererDisposal();
      this._clearTimeout = null;
    });
  }

  /**
   * Clear the scheduled disposal
   */
  public clearTimeout(): void {
    if (this._clearTimeout) {
      cancelAnimationFrame(this._clearTimeout);
      this._clearTimeout = null;
    }
  }

  /**
   * Dispose of all subscriptions
   */
  public dispose(): void {
    this._subscriptionManager.dispose();
    this._subscriptionManager = new StateSubscriptionMixin();
    this._layoutStore.dispose();
    this.clearTimeout();
  }
}
