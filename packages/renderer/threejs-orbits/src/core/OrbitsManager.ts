import * as THREE from "three";
import { type RendererStateAdapter } from "@teskooano/renderer-threejs";
import { type RenderableCelestialObject } from "@teskooano/data-types";
import {
  StateSubscriptionMixin,
  SimulationConfiguration,
} from "@teskooano/core-state";
import type { Observable } from "rxjs";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { IdealStrategy } from "./modes/IdealStrategy";
import { NBodyStrategy } from "./modes/NBodyStrategy";
import type { IOrbitVisualizationStrategy } from "./modes/IOrbitVisualizationStrategy";
import { type Layer2DManager } from "@teskooano/renderer-threejs-labels";
import { PredictionManager } from "../renderers/PredictionManager";
import {
  TrailManager,
  TrailCurveType,
  type TrailCurveConfig,
} from "../renderers/TrailManager";
import { type CelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import { engineSignalsService } from "@teskooano/app-teskooano/src/core/controllers/engine/EngineSignals.service";

/**
 * Enum defining the available modes for orbit visualization.
 * - `Ideal`: Perfect Keplerian orbits (stable, precise)
 * - `NBody`: Real-time N-Body physics with spatial optimization (Barnes-Hut, FMM, P3M, Tree-PM)
 */
export enum OrbitDisplayMode {
  Ideal = "IDEAL",
  NBody = "NBODY",
}

/**
 * Manager for orbit visualizations, serving as the main entry point for the module.
 *
 * This class coordinates between different visualization strategies (Ideal vs. N-Body)
 * and handles mode switching, visibility, and highlighting. It uses the Strategy pattern
 * to delegate the actual visualization implementation to specialized classes:
 *
 * - `IdealStrategy`: Renders perfect elliptical orbits using Keplerian parameters
 * - `NBodyStrategy`: Renders dynamic trails and predictions based on N-Body simulation
 *
 * The manager automatically selects the appropriate strategy based on the current
 * simulation configuration and provides a unified API for controlling visualizations.
 *
 * **Prediction Highlighting Delegation:**
 *
 * This manager acts as a delegation point in the prediction highlighting system:
 *
 * - Receives highlighting requests from RenderingOrchestrator
 * - Delegates to the appropriate strategy based on simulation mode
 * - Uses optional interface methods to avoid type casting
 * - Only NBodyStrategy supports prediction highlighting (IdealStrategy does not)
 * - Provides a unified interface regardless of the underlying strategy
 */
export class OrbitsManager extends StateSubscriptionMixin {
  /** Current visualization mode */
  private currentMode: OrbitDisplayMode = OrbitDisplayMode.Ideal;

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

  /** Configuration feedback display */
  private configurationFeedback: {
    lastConfig?: { mode: string; algorithm?: string; integrator?: string };
    transitionStartTime?: number;
    transitionDuration: number;
  } = {
    transitionDuration: 300, // 300ms transition as per requirements
  };

  /** Cache of the latest renderable objects */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** State adapter for accessing visualization settings */
  private stateAdapter: RendererStateAdapter;
  /** The optional manager for 2D labels, passed to strategies. */
  private layer2DManager?: Layer2DManager;

  /** Shared orbit lines group for all orbit-related visualizations */
  private idealOrbitLinesGroup: THREE.Group;
  /** Shared group for all prediction line visualizations */
  private predictionLinesGroup: THREE.Group;

  private celestialRenderers: Map<string, CelestialRenderer> = new Map();

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
    layer2DManager: Layer2DManager,
    celestialRenderers: Map<string, CelestialRenderer>,
  ) {
    super();
    this.stateAdapter = stateAdapter;
    this.layer2DManager = layer2DManager;
    this.celestialRenderers = celestialRenderers;

    // Create a shared group for ideal orbit lines
    this.idealOrbitLinesGroup = new THREE.Group();
    this.idealOrbitLinesGroup.name = "GROUP_IDEAL_ORBIT_LINES";
    objectManager.addRawObjectToScene(this.idealOrbitLinesGroup);

    // Create a shared group for prediction lines
    this.predictionLinesGroup = new THREE.Group();
    this.predictionLinesGroup.name = "GROUP_PREDICTION_LINES";
    objectManager.addRawObjectToScene(this.predictionLinesGroup);

    // Subscribe to renderable objects stream
    this.subscribeToState(renderableObjects$, (objects) => {
      this.latestRenderableObjects = objects;
    });

    // Subscribe to visualization settings
    this.subscribeToState(this.stateAdapter.$visualSettings, (settings) => {
      const newMode = this.determineVisualizationMode(
        settings.simulationConfig,
      );
      this.setVisualizationMode(newMode, objectManager, renderableObjects$);
    });

    // Subscribe to clear signals
    this.subscribeToState(engineSignalsService.clearOrbits$, () => {
      this.clearAllTrails();
    });
    this.subscribeToState(engineSignalsService.clearPredictions$, () => {
      this.clearAllPredictions();
    });
  }

  /**
   * Determines the appropriate visualization mode based on simulation configuration.
   *
   * @param config The simulation configuration
   * @returns The visualization mode to use
   */
  private determineVisualizationMode(
    config: SimulationConfiguration,
  ): OrbitDisplayMode {
    if (config.mode === "ideal") {
      return OrbitDisplayMode.Ideal;
    } else {
      // All N-Body algorithms use the same visualization strategy
      return OrbitDisplayMode.NBody;
    }
  }

  /**
   * Sets the visualization mode (Ideal or N-Body).
   *
   * This method creates the appropriate strategy based on the mode:
   * - For Ideal mode: Creates an IdealStrategy
   * - For N-Body mode: Creates a NBodyStrategy (handles all N-Body algorithms)
   *
   * @param mode - The visualization mode to use
   * @param objectManager - The scene's ObjectManager for rendering operations
   * @param renderableObjects$ - Observable stream of renderable object data
   */
  setVisualizationMode(
    mode: OrbitDisplayMode,
    objectManager: ObjectManager,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  ): void {
    if (mode === this.currentMode && this.activeStrategy) return;

    // Start transition feedback
    this.configurationFeedback.transitionStartTime = performance.now();

    const previousMode = this.currentMode;
    this.currentMode = mode;

    // Dispose of the old strategy to clean up resources
    if (this.activeStrategy) {
      this.activeStrategy.dispose();
    }

    // Log configuration change for debugging
    console.debug(`[OrbitsManager] Mode transition: ${previousMode} → ${mode}`);

    // Create the new strategy based on mode
    if (mode === OrbitDisplayMode.Ideal) {
      this.activeStrategy = new IdealStrategy(
        objectManager,
        renderableObjects$,
        this.idealOrbitLinesGroup,
      );
    } else {
      // N-Body mode uses the NBodyStrategy for all algorithms
      this.activeStrategy = new NBodyStrategy(
        objectManager,
        this.layer2DManager!,
        this.predictionLinesGroup,
        this.celestialRenderers,
      );
    }

    this.activeStrategy.setVisibility(this.orbitLinesVisible);
    this.activeStrategy.setPredictionVisibility(this.predictionLinesVisible);
  }

  /**
   * Updates all visualizations based on the current mode and settings.
   * This should be called once per frame from the render loop.
   *
   * @param deltaTime - Time elapsed since the last update in milliseconds
   */
  updateAllVisualizations(deltaTime: number): void {
    const visualSettings = this.stateAdapter.$visualSettings.getValue();

    // Update configuration feedback
    this.updateConfigurationFeedback(visualSettings.simulationConfig);

    this.activeStrategy?.update(
      this.latestRenderableObjects,
      visualSettings,
      deltaTime,
    );
  }

  /**
   * Updates configuration feedback for smooth transitions.
   *
   * @param config Current simulation configuration
   */
  private updateConfigurationFeedback(config: SimulationConfiguration): void {
    const currentConfigString = `${config.mode}-${config.algorithm || "none"}-${
      config.integrator || "none"
    }`;
    const lastConfigString = this.configurationFeedback.lastConfig
      ? `${this.configurationFeedback.lastConfig.mode}-${
          this.configurationFeedback.lastConfig.algorithm || "none"
        }-${this.configurationFeedback.lastConfig.integrator || "none"}`
      : "";

    if (currentConfigString !== lastConfigString) {
      this.configurationFeedback.lastConfig = {
        mode: config.mode,
        algorithm: config.algorithm,
        integrator: config.integrator,
      };
    }
  }

  /**
   * Gets the current visualization mode and transition status.
   *
   * @returns Information about current mode and any ongoing transitions
   */
  public getVisualizationStatus(): {
    mode: OrbitDisplayMode;
    isTransitioning: boolean;
    transitionProgress: number;
    configurationSummary: string;
  } {
    const now = performance.now();
    const transitionStartTime = this.configurationFeedback.transitionStartTime;
    const isTransitioning = transitionStartTime
      ? now - transitionStartTime <
        this.configurationFeedback.transitionDuration
      : false;

    const transitionProgress =
      isTransitioning && transitionStartTime
        ? Math.min(
            (now - transitionStartTime) /
              this.configurationFeedback.transitionDuration,
            1,
          )
        : 1;

    const config = this.configurationFeedback.lastConfig;
    const configurationSummary = config
      ? `${config.mode === "ideal" ? "Ideal Orrery" : "N-Body"} ${
          config.algorithm ? `(${config.algorithm})` : ""
        } ${config.integrator ? `[${config.integrator}]` : ""}`.trim()
      : "Unknown";

    return {
      mode: this.currentMode,
      isTransitioning,
      transitionProgress,
      configurationSummary,
    };
  }

  /**
   * Sets the visibility of orbit and trail lines.
   *
   * @param visible - Whether orbit/trail lines should be visible
   */
  public setOrbitTrailsVisibility(visible: boolean): void {
    this.orbitLinesVisible = visible;
    this.activeStrategy?.setVisibility(visible);
  }

  /**
   * Sets the visibility of prediction lines.
   *
   * @param visible - Whether prediction lines should be visible
   */
  public setPredictionVisibility(visible: boolean): void {
    this.predictionLinesVisible = visible;
    this.activeStrategy?.setPredictionVisibility(visible);
  }

  /**
   * Gets the prediction manager from the active strategy (if available).
   * Only available when using NBodyStrategy.
   *
   * @returns The prediction manager or undefined if not available
   */
  public getPredictionManager(): PredictionManager | undefined {
    if (this.activeStrategy instanceof NBodyStrategy) {
      return this.activeStrategy.predictionManager;
    }
    return undefined;
  }

  /**
   * Gets the trail manager from the active strategy (if available).
   * Only available when using NBodyStrategy.
   *
   * @returns The trail manager or undefined if not available
   */
  public getTrailManager(): TrailManager | undefined {
    if (this.activeStrategy instanceof NBodyStrategy) {
      return this.activeStrategy.orbitalRenderer as any;
    }
    return undefined;
  }

  /**
   * Sets the curve configuration for trail interpolation.
   * Only available when using NBodyStrategy.
   *
   * @param config - The curve configuration to apply
   */
  public setTrailCurveConfig(config: TrailCurveConfig): void {
    const trailManager = this.getTrailManager();
    if (trailManager) {
      trailManager.setCurveConfig(config);
    }
  }

  /**
   * Gets the current curve configuration for trail interpolation.
   * Only available when using NBodyStrategy.
   *
   * @returns The current curve configuration or undefined if not available
   */
  public getTrailCurveConfig(): TrailCurveConfig | undefined {
    const trailManager = this.getTrailManager();
    return trailManager?.getCurveConfig();
  }

  /**
   * Sets the curve configuration for prediction interpolation.
   * Only available when using NBodyStrategy.
   *
   * @param config - The curve configuration to apply
   */
  public setPredictionCurveConfig(config: TrailCurveConfig): void {
    const predictionManager = this.getPredictionManager();
    if (predictionManager) {
      predictionManager.setCurveConfig(config);
    }
  }

  /**
   * Gets the current curve configuration for prediction interpolation.
   * Only available when using NBodyStrategy.
   *
   * @returns The current curve configuration or undefined if not available
   */
  public getPredictionCurveConfig(): TrailCurveConfig | undefined {
    const predictionManager = this.getPredictionManager();
    return predictionManager?.getCurveConfig();
  }

  /**
   * Highlights a specific object's orbit visualization.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlighting
   */
  highlightVisualization(objectId: string | null): void {
    this.highlightedObjectId = objectId;
    this.activeStrategy?.highlight(objectId, this.highlightColor);
  }

  /**
   * Clears all trail visualizations.
   */
  public clearAllTrails(): void {
    if (this.activeStrategy) {
      // For NBody strategy, clear trails
      if (this.activeStrategy instanceof NBodyStrategy) {
        this.activeStrategy.orbitalRenderer.clearAllOrbitalLines();
      }
    }
  }

  /**
   * Clears all prediction visualizations.
   */
  public clearAllPredictions(): void {
    if (this.activeStrategy) {
      // For NBody strategy, clear predictions
      if ("predictionManager" in this.activeStrategy) {
        (this.activeStrategy as any).predictionManager.clearAllPredictions();
      }
    }
  }

  /**
   * Highlights prediction lines for a specific object, hiding all others.
   *
   * This method delegates to the active visualization strategy using the optional
   * `highlightPrediction` interface method. Only NBodyStrategy implements this method,
   * so highlighting only works in N-Body simulation mode.
   *
   * The highlighting flow is:
   * 1. User focuses on a celestial object (e.g., via camera controls)
   * 2. CameraManager calls RenderingOrchestrator.highlightPrediction()
   * 3. RenderingOrchestrator delegates to OrbitsManager.highlightPrediction()
   * 4. OrbitsManager delegates to the active strategy's highlightPrediction method
   * 5. PredictionManager handles the actual highlighting logic
   *
   * @param objectId - ID of the object to show prediction for, or null to hide all predictions
   */
  public highlightPrediction(objectId: string | null): void {
    if (!this.activeStrategy) {
      return; // No active strategy, nothing to highlight
    }

    // Use the optional highlightPrediction method if available
    if (this.activeStrategy.highlightPrediction) {
      this.activeStrategy.highlightPrediction(objectId);
    }
    // Note: IdealStrategy doesn't implement highlightPrediction (uses static orbits)
  }

  /**
   * Cleans up resources used by this manager.
   * Should be called when the manager is no longer needed.
   */
  dispose(): void {
    this.activeStrategy?.dispose();
  }
}
