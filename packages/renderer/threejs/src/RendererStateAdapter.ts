import {
  StateAccessor,
  renderableStore,
  type SimulationState,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import { CelestialObject } from "@teskooano/data-types";
import { calculateLightSourceMaps } from "@teskooano/renderer-threejs-lighting";
import { BehaviorSubject } from "rxjs";
import { RenderableObjectFactory } from "@teskooano/renderer-threejs-objects";
import type { RendererVisualSettings } from "./types";

/**
 * Acts as a bridge between the core application state and the rendering engine.
 *
 * This class subscribes to the main application state observables through `StateAccessor`.
 * It transforms the raw, physics-based data into a
 * `RenderableCelestialObject` format that the various rendering managers can
 * consume. This transformation includes scaling positions, calculating rotations,
 * and determining lighting relationships.
 *
 * It then publishes the transformed data to the central `renderableStore`,
 * decoupling the renderer from the core application logic.
 */
export class RendererStateAdapter extends StateSubscriptionMixin {
  /** An observable for visual settings that renderer components can subscribe to. */
  public $visualSettings: BehaviorSubject<RendererVisualSettings>;

  /** The current simulation time, used for calculating rotations. */
  private currentSimulationTime: number = 0;

  /** The factory for creating renderable object instances. */
  private factory: RenderableObjectFactory;

  /**
   * Initializes the adapter and subscribes to the core state.
   */
  constructor() {
    super();
    this.factory = new RenderableObjectFactory();
    const initialSimState = StateAccessor.getCurrentSimulationState();
    this.$visualSettings = new BehaviorSubject<RendererVisualSettings>({
      trailLengthMultiplier:
        initialSimState.visualSettings.trailLengthMultiplier,
      physicsEngine:
        initialSimState.physicsEngine === "verlet" ? "verlet" : "keplerian",
      timeScale: initialSimState.timeScale,
      predictionSteps: initialSimState.visualSettings.predictionSteps,
      predictionDuration: initialSimState.visualSettings.predictionDuration,
    });

    this.subscribeToCoreState();
  }

  /**
   * The main processing handler for celestial object updates.
   *
   * This method is called whenever the celestial objects state updates.
   * It orchestrates the transformation of core state objects into renderable
   * objects by first calculating the lighting hierarchy and then delegating
   * the creation logic to the `RenderableObjectFactory`.
   *
   * @param objects The complete record of celestial objects from the core state.
   */
  private processCelestialObjectsUpdateNow(
    objects: Record<string, CelestialObject>,
  ): void {
    if (Object.keys(objects).length === 0) {
      renderableStore.setAllRenderableObjects({});
      return;
    }

    try {
      // 1. Determine the lighting hierarchy for all objects.
      const lightSourceMap = calculateLightSourceMaps(objects);

      // 2. Delegate creation of renderable objects to the factory.
      const renderableMap = this.factory.createRenderableObjects(
        objects,
        lightSourceMap,
        this.currentSimulationTime,
      );

      // 3. Update the central store with the new set of objects.
      renderableStore.setAllRenderableObjects(renderableMap);
    } catch (error) {
      console.error(
        "[RendererStateAdapter] Error during object processing loop:",
        error,
      );
    }
  }

  /**
   * Subscribes to the core application state observables.
   *
   * Sets up the subscriptions to the core state observables that
   * drive all the updates within this adapter.
   */
  private subscribeToCoreState(): void {
    // ✅ Using StateSubscriptionMixin for clean subscription management
    this.subscribeToState(
      StateAccessor.getCelestialObjectsStream(),
      (objects) => this.processCelestialObjectsUpdateNow(objects),
    );

    // ✅ Using RxJS operators for cleaner visual settings transformation
    this.subscribeToStateWithMapping(
      StateAccessor.getSimulationStateStream(),
      (simState: SimulationState) => {
        // Update simulation time
        this.currentSimulationTime = simState.time ?? 0;

        // Extract and transform visual settings
        return this.extractVisualSettings(simState);
      },
      (visualSettings: RendererVisualSettings) => {
        // Only emit if settings have actually changed
        const currentSettings = this.$visualSettings.getValue();
        if (!this.compareVisualSettings(currentSettings, visualSettings)) {
          this.$visualSettings.next(visualSettings);
        }
      },
    );
  }

  /**
   * Extracts visual settings from simulation state.
   * @param simState The simulation state to extract from
   * @returns The extracted visual settings
   */
  private extractVisualSettings(
    simState: SimulationState,
  ): RendererVisualSettings {
    return {
      trailLengthMultiplier:
        simState.visualSettings.trailLengthMultiplier ?? 150,
      physicsEngine:
        simState.physicsEngine === "verlet" ? "verlet" : "keplerian",
      timeScale: simState.timeScale,
      predictionSteps: simState.visualSettings.predictionSteps,
      predictionDuration: simState.visualSettings.predictionDuration,
    };
  }

  /**
   * Compares two visual settings objects for equality.
   * @param a First settings object
   * @param b Second settings object
   * @returns True if settings are equal, false otherwise
   */
  private compareVisualSettings(
    a: RendererVisualSettings,
    b: RendererVisualSettings,
  ): boolean {
    return (
      a.trailLengthMultiplier === b.trailLengthMultiplier &&
      a.physicsEngine === b.physicsEngine &&
      a.timeScale === b.timeScale &&
      a.predictionSteps === b.predictionSteps &&
      a.predictionDuration === b.predictionDuration
    );
  }

  /**
   * Cleans up all subscriptions to prevent memory leaks.
   */
  public dispose(): void {
    // ✅ Using StateSubscriptionMixin for automatic subscription cleanup
    super.dispose();
  }
}
