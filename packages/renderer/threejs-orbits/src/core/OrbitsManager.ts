import * as THREE from "three";
import { type RendererStateAdapter } from "@teskooano/renderer-threejs";
import { type RenderableCelestialObject } from "@teskooano/data-types";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import type { Observable } from "rxjs";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { KeplerianStrategy } from "./modes/KeplerianStrategy";
import { VerletStrategy } from "./modes/VerletStrategy";
import type { IOrbitVisualizationStrategy } from "./modes/IOrbitVisualizationStrategy";
import { type Layer2DManager } from "@teskooano/renderer-threejs-labels";
import { PredictionManager } from "../verlet/PredictionManager";
import { TrailManager } from "../verlet/TrailManager";

/**
 * Enum defining the available modes for orbit visualization.
 * - `Keplerian`: Static elliptical orbits calculated from orbital parameters.
 * - `Verlet`: Dynamic trails and predictions based on Verlet integration physics.
 */
export enum OrbitDisplayMode {
  Keplerian = "KEPLERIAN",
  Verlet = "VERLET",
}

/**
 * Manager for orbit visualizations, serving as the main entry point for the module.
 *
 * This class coordinates between different visualization systems (Keplerian orbits,
 * Verlet trails, and trajectory predictions) and handles mode switching, visibility,
 * and highlighting.
 */
export class OrbitsManager extends StateSubscriptionMixin {
  /** Current visualization mode */
  private currentMode: OrbitDisplayMode = OrbitDisplayMode.Keplerian;

  /** Active strategy for orbit visualization */
  private activeStrategy?: IOrbitVisualizationStrategy;

  /** Flag indicating if orbit/trail visualizations are visible */
  private orbitLinesVisible: boolean = true;
  /** Flag indicating if prediction line visualizations are visible */
  private predictionLinesVisible: boolean = true;

  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;

  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);

  /** Cache of the latest renderable objects */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** State adapter for accessing visualization settings */
  private stateAdapter: RendererStateAdapter;
  /** The optional manager for 2D labels, passed to strategies. */
  private layer2DManager?: Layer2DManager;

  /**
   * Creates a new OrbitsManager instance.
   *
   * @param objectManager - The scene's ObjectManager for rendering operations
   * @param stateAdapter - Adapter for accessing engine state and settings
   * @param renderableObjects$ - Observable stream of renderable object data
   * @param layer2DManager - Optional manager for 2D labels.
   */
  constructor(
    objectManager: ObjectManager,
    stateAdapter: RendererStateAdapter,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    layer2DManager?: Layer2DManager,
  ) {
    super();
    this.stateAdapter = stateAdapter;
    this.layer2DManager = layer2DManager;

    // Subscribe to renderable objects stream
    this.subscribeToState(renderableObjects$, (objects) => {
      this.latestRenderableObjects = objects;
    });

    // Subscribe to visualization settings
    this.subscribeToState(this.stateAdapter.$visualSettings, (settings) => {
      const newMode =
        settings.physicsEngine === "verlet"
          ? OrbitDisplayMode.Verlet
          : OrbitDisplayMode.Keplerian;

      this.setVisualizationMode(newMode, objectManager, renderableObjects$);
    });

    // Set initial mode based on current settings
    const initialSettings = this.stateAdapter.$visualSettings.getValue();
    this.setVisualizationMode(
      initialSettings.physicsEngine === "verlet"
        ? OrbitDisplayMode.Verlet
        : OrbitDisplayMode.Keplerian,
      objectManager,
      renderableObjects$,
    );
  }

  /**
   * Sets the visualization mode (Keplerian or Verlet).
   *
   * @param mode - The visualization mode to use
   */
  setVisualizationMode(
    mode: OrbitDisplayMode,
    objectManager: ObjectManager,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  ): void {
    if (mode === this.currentMode && this.activeStrategy) return;
    this.currentMode = mode;

    // Dispose of the old strategy to clean up resources
    if (this.activeStrategy) {
      this.activeStrategy.dispose();
    }

    // Create the new strategy
    if (mode === OrbitDisplayMode.Keplerian) {
      this.activeStrategy = new KeplerianStrategy(
        objectManager,
        renderableObjects$,
      );
    } else {
      this.activeStrategy = new VerletStrategy(
        objectManager,
        this.layer2DManager,
      );
    }

    this.activeStrategy.setVisibility(this.orbitLinesVisible);
    this.activeStrategy.setPredictionVisibility(this.predictionLinesVisible);
  }

  /**
   * Updates all visualizations based on the current mode and settings.
   * This should be called once per frame from the render loop.
   */
  updateAllVisualizations(deltaTime: number): void {
    const visualSettings = this.stateAdapter.$visualSettings.getValue();
    this.activeStrategy?.update(
      this.latestRenderableObjects,
      visualSettings,
      deltaTime,
    );
  }

  /**
   * Sets the visibility of the main orbit/trail lines.
   *
   * @param visible - Whether orbit/trail lines should be visible
   */
  public setOrbitTrailsVisibility(visible: boolean): void {
    this.orbitLinesVisible = visible;
    this.activeStrategy?.setVisibility(visible);
  }

  /**
   * Sets the visibility of prediction lines (only applicable in Verlet mode).
   *
   * @param visible - Whether prediction lines should be visible
   */
  public setPredictionVisibility(visible: boolean): void {
    this.predictionLinesVisible = visible;
    this.activeStrategy?.setPredictionVisibility(visible);
  }

  /**
   * Returns the PredictionManager instance if the current mode is 'Verlet'.
   * @returns The PredictionManager instance or undefined.
   */
  public getPredictionManager(): PredictionManager | undefined {
    if (this.activeStrategy instanceof VerletStrategy) {
      return this.activeStrategy.predictionManager;
    }
    return undefined;
  }

  /**
   * Returns the TrailManager instance if the current mode is 'Verlet'.
   * @returns The TrailManager instance or undefined.
   */
  public getTrailManager(): TrailManager | undefined {
    if (this.activeStrategy instanceof VerletStrategy) {
      return this.activeStrategy.trailManager;
    }
    return undefined;
  }

  /**
   * Highlights a specific object's visualizations.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlight
   */
  highlightVisualization(objectId: string | null): void {
    this.activeStrategy?.highlight(objectId, this.highlightColor);
  }

  /**
   * Cleans up all resources used by the managers.
   * Should be called when the manager is no longer needed.
   */
  dispose(): void {
    // Clean up subscriptions using mixin
    super.dispose();

    // Clean up visualization managers
    this.activeStrategy?.dispose();

    this.highlightedObjectId = null;
  }
}
