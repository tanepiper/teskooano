import * as THREE from "three";
import { type RendererStateAdapter } from "@teskooano/renderer-threejs";
import { type RenderableCelestialObject } from "@teskooano/data-types";
import type { Observable, Subscription } from "rxjs";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { KeplerianStrategy } from "./modes/KeplerianStrategy";
import { VerletStrategy } from "./modes/VerletStrategy";
import type { IOrbitVisualizationStrategy } from "./modes/IOrbitVisualizationStrategy";
import { TrailManager } from "../verlet/TrailManager";
import { PredictionManager } from "../verlet/PredictionManager";

/**
 * Enum defining the available modes for orbit visualization.
 * - `Keplerian`: Static elliptical orbits calculated from orbital parameters.
 * - `Verlet`: Dynamic trails and predictions based on Verlet integration physics.
 */
export enum VisualizationMode {
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
export class OrbitsManager {
  /** Current visualization mode */
  private currentMode: VisualizationMode = VisualizationMode.Keplerian;

  /** Active strategy for orbit visualization */
  private activeStrategy: IOrbitVisualizationStrategy;

  /** Manager for Keplerian (static elliptical) orbit visualizations */
  private keplerianStrategy: KeplerianStrategy;

  /** Manager for position history trail visualizations */
  private verletStrategy: VerletStrategy;

  /** Flag indicating if orbit/trail visualizations are visible */
  private orbitLinesVisible: boolean = true;
  /** Flag indicating if prediction line visualizations are visible */
  private predictionLinesVisible: boolean = true;

  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;

  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);

  /** Subscription for the adapter settings */
  private adapterSettingsSubscription: Subscription | null = null;

  /** Subscription for renderable objects */
  private objectsSubscription: Subscription | null = null;

  /** Cache of the latest renderable objects */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** State adapter for accessing visualization settings */
  private stateAdapter: RendererStateAdapter;

  /**
   * Creates a new OrbitsManager instance.
   *
   * @param objectManager - The scene's ObjectManager for rendering operations
   * @param stateAdapter - Adapter for accessing engine state and settings
   * @param renderableObjects$ - Observable stream of renderable object data
   */
  constructor(
    objectManager: ObjectManager,
    stateAdapter: RendererStateAdapter,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  ) {
    this.stateAdapter = stateAdapter;

    // Initialize strategies
    this.keplerianStrategy = new KeplerianStrategy(
      objectManager,
      renderableObjects$,
    );
    this.verletStrategy = new VerletStrategy(objectManager);
    this.activeStrategy = this.keplerianStrategy;

    // Subscribe to renderable objects stream
    this.objectsSubscription = renderableObjects$.subscribe((objects) => {
      this.latestRenderableObjects = objects;
    });

    // Subscribe to visualization settings
    this.adapterSettingsSubscription =
      this.stateAdapter.$visualSettings.subscribe((settings) => {
        const newMode =
          settings.physicsEngine === "verlet"
            ? VisualizationMode.Verlet
            : VisualizationMode.Keplerian;

        if (newMode !== this.currentMode) {
          this.setVisualizationMode(newMode);
        }
      });

    // Set initial mode based on current settings
    const initialSettings = this.stateAdapter.$visualSettings.getValue();
    this.setVisualizationMode(
      initialSettings.physicsEngine === "verlet"
        ? VisualizationMode.Verlet
        : VisualizationMode.Keplerian,
    );
  }

  /**
   * Provides access to the PredictionManager instance.
   */
  public getPredictionManager(): PredictionManager {
    // This is problematic with the new structure, but we'll leave it for now
    // to avoid breaking external dependencies. A better approach would be
    // to refactor consumers to not need direct access.
    return this.verletStrategy.predictionManager;
  }

  /**
   * Provides access to the TrailManager instance.
   */
  public getTrailManager(): TrailManager {
    // Similar to getPredictionManager, this is not ideal.
    return this.verletStrategy.trailManager;
  }

  /**
   * Sets the visualization mode (Keplerian or Verlet).
   *
   * @param mode - The visualization mode to use
   */
  setVisualizationMode(mode: VisualizationMode): void {
    if (mode === this.currentMode && this.activeStrategy) return;
    this.currentMode = mode;

    const inactiveStrategy =
      mode === VisualizationMode.Keplerian
        ? this.verletStrategy
        : this.keplerianStrategy;
    inactiveStrategy.setVisibility(false);
    inactiveStrategy.setPredictionVisibility(false);

    this.activeStrategy =
      mode === VisualizationMode.Keplerian
        ? this.keplerianStrategy
        : this.verletStrategy;
    this.activeStrategy.setVisibility(this.orbitLinesVisible);
    this.activeStrategy.setPredictionVisibility(this.predictionLinesVisible);
  }

  /**
   * Updates all visualizations based on the current mode and settings.
   * This should be called once per frame from the render loop.
   */
  updateAllVisualizations(deltaTime: number): void {
    const visualSettings = this.stateAdapter.$visualSettings.getValue();
    this.activeStrategy.update(
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
    if (this.activeStrategy) {
      this.activeStrategy.setVisibility(visible);
    }
  }

  /**
   * Sets the visibility of prediction lines (only applicable in Verlet mode).
   *
   * @param visible - Whether prediction lines should be visible
   */
  public setPredictionVisibility(visible: boolean): void {
    this.predictionLinesVisible = visible;
    if (this.activeStrategy) {
      this.activeStrategy.setPredictionVisibility(visible);
    }
  }

  /**
   * Highlights a specific object's visualizations.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlight
   */
  highlightVisualization(objectId: string | null): void {
    this.activeStrategy.highlight(objectId, this.highlightColor);
  }

  /**
   * Cleans up all resources used by the managers.
   * Should be called when the manager is no longer needed.
   */
  dispose(): void {
    // Clean up subscriptions
    this.adapterSettingsSubscription?.unsubscribe();
    this.adapterSettingsSubscription = null;

    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;

    // Clean up visualization managers
    this.keplerianStrategy.dispose();
    this.verletStrategy.dispose();

    this.highlightedObjectId = null;
  }
}
