import { type PhysicsStateReal } from "@teskooano/core-physics";
import { getCelestialObjects } from "@teskooano/core-state";
import type {
  RenderableCelestialObject,
  RendererStateAdapter,
} from "@teskooano/renderer-threejs";
import type { Observable, Subscription } from "rxjs";
import * as THREE from "three";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { KeplerianOrbitManager } from "./orbit-manager";
import { predictTrajectory } from "@teskooano/core-physics";

/**
 * Enum defining the available modes for orbit visualization.
 * - `Keplerian`: Static elliptical orbits calculated from orbital parameters.
 * - `Verlet`: Dynamic trails and predictions based on Verlet integration physics.
 */
export enum VisualizationMode {
  Keplerian = "KEPLERIAN",
  Verlet = "VERLET",
}

const isMobileWidth = window.innerWidth < 1024;

// Shared materials to avoid unnecessary cloning and improve memory usage
const SHARED_MATERIALS = {
  // Trail material for showing object history
  TRAIL: new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: isMobileWidth ? 2 : 5,
    transparent: true,
    opacity: 1,
    depthTest: true,
  }),

  // Prediction material for showing future path
  PREDICTION: new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: isMobileWidth ? 2 : 5,
    transparent: true,
    opacity: 1,
    depthTest: true,
  }),
};

/**
 * Manages the creation, update, and display of orbital path visualizations in the scene.
 *
 * This class handles two main modes:
 * 1.  **Keplerian:** Renders static elliptical orbit lines based on classical orbital elements.
 * 2.  **Verlet:** Renders dynamic trails (recent history) and predicted future paths based on
 *     N-body simulation results using Verlet integration.
 *
 * It interacts with the `ObjectManager` to add/remove lines from the scene, the
 * `RendererStateAdapter` to get visualization settings (like mode and trail length),
 * and the `renderableObjectsStore` (and `celestialObjectsStore`) to access object data
 * for calculations and updates.
 */
export class OrbitManager {
  /** Map storing dynamic Verlet integration trail lines, keyed by celestial object ID. */
  public trailLines: Map<string, THREE.Line> = new Map();
  /** Map storing dynamic Verlet integration prediction lines, keyed by celestial object ID. */
  public predictionLines: Map<string, THREE.Line> = new Map();

  /** Stores recent position history for Verlet trails, keyed by object ID. */
  private positionHistory: Map<string, THREE.Vector3[]> = new Map();
  /** Duration (in seconds) into the future for Verlet predictions. */
  private predictionDuration: number = 3600 * 12;
  /** Number of steps used in Verlet prediction calculation. Affects resolution. */
  private predictionSteps: number = 200;

  /** Stores the calculated points for the prediction line to avoid recalculation every frame, keyed by object ID. */
  private predictedLinePoints: Map<string, THREE.Vector3[]> = new Map();
  /** Counter used to throttle how often Verlet predictions are recalculated. */
  private predictionUpdateCounter: number = 0;
  /** Recalculate predictions every N calls to `updateAllVisualizations`. */
  private readonly predictionUpdateFrequency: number = 15;

  /** Counter used to throttle how often Verlet trail geometries are sent to the GPU. */
  private trailUpdateCounter: number = 0;
  /** Send trail geometry updates to the GPU every N calls to `updateAllVisualizations`. */
  private readonly trailUpdateFrequency: number = 5;

  /** Cache of buffer attributes to reduce garbage collection */
  private bufferCache: Map<number, THREE.BufferAttribute> = new Map();

  /** Maximum size to store in the buffer cache */
  private readonly MAX_CACHED_BUFFER_SIZE = 10000;

  /** Reference to the ObjectManager for adding/removing lines from the scene. */
  private objectManager: ObjectManager;
  /** Reference to the RendererStateAdapter for accessing visualization settings. */
  private stateAdapter: RendererStateAdapter;
  /** Reference to the store containing renderable object data. */
  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;
  /** Added property to hold the latest state */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};
  /** Added property to hold the subscription */
  private objectsSubscription: Subscription | null = null;

  /** Current visibility state of all managed visualization lines. */
  private visualizationVisible: boolean = true;
  /** ID of the currently highlighted celestial object, or null if none. */
  private highlightedObjectId: string | null = null;
  /** Color used to highlight orbit/trail/prediction lines. */
  private highlightColor: THREE.Color = new THREE.Color(0xffff00);

  /** The current active visualization mode (`Keplerian` or `Verlet`). */
  private currentMode: VisualizationMode = VisualizationMode.Keplerian;
  /** Unsubscribe function for the adapter settings listener. */
  private unsubscribeAdapterSettings: Subscription | null = null;

  /** Add instance of the new manager */
  private keplerianManager: KeplerianOrbitManager;

  /**
   * Creates an instance of OrbitManager.
   *
   * @param objectManager - The scene's `ObjectManager` instance.
   * @param stateAdapter - The `RendererStateAdapter` for accessing visual settings.
   * @param renderableObjects$ - An Observable emitting `RenderableCelestialObject` data.
   */
  constructor(
    objectManager: ObjectManager,
    stateAdapter: RendererStateAdapter,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  ) {
    this.objectManager = objectManager;
    this.stateAdapter = stateAdapter;
    this.renderableObjects$ = renderableObjects$;

    this.objectsSubscription = this.renderableObjects$.subscribe((objects) => {
      this.latestRenderableObjects = objects;
    });

    this.keplerianManager = new KeplerianOrbitManager(
      objectManager,
      this.renderableObjects$,
    );

    this.unsubscribeAdapterSettings =
      this.stateAdapter.$visualSettings.subscribe((settings) => {
        const newMode =
          settings.physicsEngine === "verlet"
            ? VisualizationMode.Verlet
            : VisualizationMode.Keplerian;

        if (newMode !== this.currentMode) {
          this.setVisualizationMode(newMode);
        }
      });

    const initialSettings = this.stateAdapter.$visualSettings.getValue();
    this.currentMode =
      initialSettings.physicsEngine === "verlet"
        ? VisualizationMode.Verlet
        : VisualizationMode.Keplerian;
  }

  /**
   * Sets the visualization mode (`Keplerian` or `Verlet`).
   *
   * Clears visualizations associated with the previous mode and triggers an update
   * for the new mode.
   *
   * @param mode - The `VisualizationMode` to switch to.
   */
  setVisualizationMode(mode: VisualizationMode): void {
    if (mode === this.currentMode) return;

    this.currentMode = mode;

    if (mode === VisualizationMode.Verlet) {
      this.keplerianManager.clearAll();
    } else {
      this.trailLines.forEach((line, id) => this.removeVisualization(id));
      this.trailLines.clear();
      this.predictionLines.forEach((line, id) => this.removeVisualization(id));
      this.predictionLines.clear();
      this.positionHistory.clear();
    }

    this.updateAllVisualizations();
  }

  /**
   * Updates all active visualizations based on the current mode and object states.
   *
   * This is the main update loop called each frame. It handles:
   * - Cleaning up lines for removed objects.
   * - Creating/updating Keplerian lines if in `Keplerian` mode.
   * - Creating/updating Verlet trails if in `Verlet` mode.
   * - Calculating and updating Verlet predictions (throttled) for the highlighted object if in `Verlet` mode.
   */
  updateAllVisualizations(): void {
    const objects = this.latestRenderableObjects;
    const visualSettings = this.stateAdapter.$visualSettings.getValue();

    this.cleanupRemovedObjects(objects);

    // Periodically clean up excess memory usage
    if (this.predictionUpdateCounter === 0) {
      this.limitHistoryDataMemory();
    }

    if (this.currentMode === VisualizationMode.Keplerian) {
      Object.values(objects).forEach((obj) => {
        if (obj.orbit && obj.parentId) {
          this.keplerianManager.createOrUpdate(
            obj.celestialObjectId,
            obj.orbit,
            obj.parentId,
            this.visualizationVisible,
            this.highlightedObjectId,
            this.highlightColor,
          );
        } else if (this.keplerianManager.lines.has(obj.celestialObjectId)) {
          this.keplerianManager.remove(obj.celestialObjectId);
        }
      });
    } else {
      this.trailUpdateCounter++;
      const shouldUpdateTrailGeometry =
        this.trailUpdateCounter >= this.trailUpdateFrequency;
      if (shouldUpdateTrailGeometry) {
        this.trailUpdateCounter = 0;
      }

      Object.values(objects).forEach((obj) => {
        this.createOrUpdateVerletTrail(
          obj.celestialObjectId,
          obj,
          shouldUpdateTrailGeometry,
        );
      });

      this.predictionUpdateCounter++;
      const shouldUpdatePredictions =
        this.predictionUpdateCounter >= this.predictionUpdateFrequency;

      if (shouldUpdatePredictions) {
        this.predictionUpdateCounter = 0;
      }

      const fullObjectsMap = getCelestialObjects();
      const allCurrentPhysicsStates = Object.values(fullObjectsMap)
        .map((co) => co.physicsStateReal)
        .filter((state): state is PhysicsStateReal => !!state);

      Object.values(objects).forEach((renderableObj) => {
        const targetId = renderableObj.celestialObjectId;
        const fullTargetObject = fullObjectsMap[targetId];

        if (targetId === this.highlightedObjectId) {
          if (fullTargetObject?.physicsStateReal) {
            if (shouldUpdatePredictions) {
              const otherPhysicsStates = allCurrentPhysicsStates.filter(
                (state) => state.id !== targetId,
              );
              const newPredictionPoints = predictTrajectory(
                targetId,
                [fullTargetObject.physicsStateReal, ...otherPhysicsStates],
                this.predictionDuration,
                this.predictionSteps,
              );
              this.predictedLinePoints.set(targetId, newPredictionPoints);
              this.updatePredictionLine(targetId, newPredictionPoints);
            } else {
              const storedPoints = this.predictedLinePoints.get(targetId);
              if (storedPoints) {
                this.updatePredictionLine(targetId, storedPoints);
              } else {
                const otherPhysicsStates = allCurrentPhysicsStates.filter(
                  (state) => state.id !== targetId,
                );
                const initialPoints = predictTrajectory(
                  targetId,
                  [fullTargetObject.physicsStateReal, ...otherPhysicsStates],
                  this.predictionDuration,
                  this.predictionSteps,
                );
                this.predictedLinePoints.set(targetId, initialPoints);
                this.updatePredictionLine(targetId, initialPoints);
              }
            }

            const predictionLine = this.predictionLines.get(targetId);
            if (predictionLine)
              predictionLine.visible = this.visualizationVisible;
          } else {
            this.removePredictionLineVisually(targetId);
          }
        } else {
          this.removePredictionLineVisually(targetId);
        }
      });
    }
  }

  /**
   * Removes visualization lines (Keplerian, Trail, Prediction) for objects
   * that are no longer present in the provided map of current objects.
   *
   * @param currentRenderableObjects - A record of currently active `RenderableCelestialObject`s.
   * @internal
   */
  cleanupRemovedObjects(
    currentRenderableObjects: Record<string, RenderableCelestialObject>,
  ): void {
    const currentIds = new Set(Object.keys(currentRenderableObjects));
    const removalCandidates = new Set<string>();

    this.keplerianManager.lines.forEach((_, id) => {
      if (!currentIds.has(id)) removalCandidates.add(id);
    });
    this.trailLines.forEach((_, id) => {
      if (!currentIds.has(id)) removalCandidates.add(id);
    });
    this.predictionLines.forEach((_, id) => {
      if (!currentIds.has(id)) removalCandidates.add(id);
    });

    removalCandidates.forEach((id) => this.removeVisualization(id));
  }

  /**
   * Updates the position history for a specific object and triggers an update
   * of its Verlet trail line. The length of the trail is determined by the
   * `trailLengthMultiplier` setting in the `RendererStateAdapter`.
   *
   * @param id - The ID of the object to update the trail for.
   * @param obj - The `RenderableCelestialObject` containing the current position.
   * @internal Called by `updateAllVisualizations` when in Verlet mode.
   */
  createOrUpdateVerletTrail(
    id: string,
    obj: RenderableCelestialObject,
    shouldUpdateGeometry: boolean,
  ): void {
    const multiplier =
      this.stateAdapter.$visualSettings.getValue().trailLengthMultiplier;
    const maxHistoryLength = 100 * multiplier;

    let history = this.positionHistory.get(id);
    if (!history) {
      history = [];
      this.positionHistory.set(id, history);
    }
    history.push(obj.position.clone());
    if (history.length > maxHistoryLength) {
      history.shift();
    }
    this.updateTrailLine(id, history, maxHistoryLength, shouldUpdateGeometry);
  }

  /**
   * Creates or updates the `THREE.Line` object representing the Verlet trail for an object.
   *
   * If the line doesn't exist, it's created with a buffer geometry sized for `maxPoints`.
   * If it exists, its geometry's position attribute is updated with the provided `points`.
   * The draw range is adjusted to match the number of points actually drawn.
   *
   * @param id - The ID of the object whose trail line is being updated.
   * @param points - An array of `THREE.Vector3` representing the recent position history.
   * @param maxPoints - The maximum number of points the trail line geometry should accommodate.
   * @internal Called by `createOrUpdateVerletTrail`.
   */
  updateTrailLine(
    id: string,
    points: THREE.Vector3[],
    maxPoints: number,
    shouldUpdateGeometry: boolean,
  ): void {
    let line = this.trailLines.get(id);
    const safeMaxPoints = Math.max(1, Math.floor(maxPoints));

    const pointsToUse = points;

    if (!line) {
      const bufferSize = safeMaxPoints;
      if (bufferSize <= 0) {
        return;
      }

      // Create or reuse a buffer attribute from the cache
      let positionAttribute: THREE.BufferAttribute;

      if (this.bufferCache.has(bufferSize)) {
        // Reuse a cached buffer of the same size
        positionAttribute = this.bufferCache.get(bufferSize)!;
        this.bufferCache.delete(bufferSize);

        // Reset the buffer data if needed
        const positions = positionAttribute.array as Float32Array;
        positions.fill(0);
      } else {
        // Create a new buffer
        const positions = new Float32Array(bufferSize * 3);
        positionAttribute = new THREE.BufferAttribute(positions, 3);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", positionAttribute);
      geometry.setDrawRange(0, 0);

      line = new THREE.Line(geometry, SHARED_MATERIALS.TRAIL.clone());
      line.name = `trail-line-${id}`;
      line.frustumCulled = false;
      this.objectManager.addRawObjectToScene(line);
      this.trailLines.set(id, line);
    } else {
      const geometry = line.geometry;
      let positionAttribute = geometry.attributes
        .position as THREE.BufferAttribute;
      const existingCapacity = positionAttribute.count;

      const requiredCapacity = safeMaxPoints;

      if (existingCapacity < requiredCapacity) {
        // Need to allocate larger buffer
        let newPositionAttribute: THREE.BufferAttribute;

        // Try to get a buffer from cache first
        if (this.bufferCache.has(requiredCapacity)) {
          newPositionAttribute = this.bufferCache.get(requiredCapacity)!;
          this.bufferCache.delete(requiredCapacity);

          // Copy existing data to the new buffer
          const newPositions = newPositionAttribute.array as Float32Array;
          newPositions.set(
            positionAttribute.array.slice(0, existingCapacity * 3),
          );
        } else {
          // Create new buffer and copy data
          const newPositions = new Float32Array(requiredCapacity * 3);
          newPositions.set(
            positionAttribute.array.slice(0, existingCapacity * 3),
          );
          newPositionAttribute = new THREE.BufferAttribute(newPositions, 3);
        }

        // Cache the old buffer if it's not too large
        if (existingCapacity <= this.MAX_CACHED_BUFFER_SIZE) {
          // Reset the old buffer data before caching
          const oldArray = positionAttribute.array as Float32Array;
          oldArray.fill(0);
          this.bufferCache.set(existingCapacity, positionAttribute);
        }

        geometry.deleteAttribute("position");
        positionAttribute = newPositionAttribute;
        geometry.setAttribute("position", positionAttribute);
        geometry.setDrawRange(0, requiredCapacity);
      }

      const pointsToDraw = Math.min(
        pointsToUse.length,
        positionAttribute.count,
      );

      // Optimized loop: Directly access vector components
      const positions = positionAttribute.array as Float32Array;
      for (let i = 0; i < pointsToDraw; i++) {
        const point = pointsToUse[i];
        const offset = i * 3;
        positions[offset] = point.x;
        positions[offset + 1] = point.y;
        positions[offset + 2] = point.z;
      }

      if (shouldUpdateGeometry) {
        positionAttribute.needsUpdate = true;
        geometry.setDrawRange(0, pointsToDraw);
      }

      line.visible = this.visualizationVisible;
      this.applyHighlight(id, line);
    }
  }

  /**
   * Creates or updates the `THREE.Line` object representing the Verlet prediction path for an object.
   *
   * If the line doesn't exist, it's created with a buffer geometry sized for `predictionSteps`.
   * If it exists, its geometry's position attribute is updated with the provided `points`.
   * Handles cases where prediction calculation yields insufficient points.
   *
   * @param id - The ID of the object whose prediction line is being updated.
   * @param points - An array of `THREE.Vector3` representing the predicted future positions.
   * @internal Called by `updateAllVisualizations` when in Verlet mode for the highlighted object.
   */
  updatePredictionLine(id: string, points: THREE.Vector3[]): void {
    if (points.length < 2) {
      if (this.predictionLines.has(id)) this.removeVisualization(id);
      return;
    }
    let line = this.predictionLines.get(id);
    const maxPoints = this.predictionSteps;

    if (!line) {
      // Create or reuse a buffer from the cache
      let positionAttribute: THREE.BufferAttribute;

      if (this.bufferCache.has(maxPoints)) {
        // Reuse a cached buffer of the same size
        positionAttribute = this.bufferCache.get(maxPoints)!;
        this.bufferCache.delete(maxPoints);

        // Reset the buffer data
        const positions = positionAttribute.array as Float32Array;
        positions.fill(0);
      } else {
        // Create a new buffer
        const positions = new Float32Array(maxPoints * 3);
        positionAttribute = new THREE.BufferAttribute(positions, 3);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", positionAttribute);
      geometry.setDrawRange(0, 0);

      line = new THREE.Line(geometry, SHARED_MATERIALS.PREDICTION.clone());
      line.name = `prediction-line-${id}`;
      line.frustumCulled = false;
      this.objectManager.addRawObjectToScene(line);
      this.predictionLines.set(id, line);
    }

    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;

    const numPointsToCopy = Math.min(points.length, maxPoints);
    for (let i = 0; i < numPointsToCopy; i++) {
      points[i].toArray(positionAttribute.array, i * 3);
    }

    positionAttribute.needsUpdate = true;
    geometry.setDrawRange(0, numPointsToCopy);
    geometry.computeBoundingSphere();

    if (
      !line.userData.defaultColor ||
      line.userData.defaultColor.getHex() !==
        SHARED_MATERIALS.PREDICTION.color.getHex()
    ) {
      line.userData.defaultColor = SHARED_MATERIALS.PREDICTION.color.clone();
    }

    line.visible = this.visualizationVisible;
    this.applyHighlight(id, line);
  }

  /**
   * Removes a specific trail line from the scene and internal tracking.
   *
   * Disposes of the line's geometry and material.
   *
   * @param objectId - The ID of the object whose trail line should be removed.
   * @private
   */
  private removeTrailLine(objectId: string): void {
    const trailLine = this.trailLines.get(objectId);
    if (trailLine) {
      this.objectManager.removeRawObjectFromScene(trailLine);
      trailLine.geometry.dispose();
      (trailLine.material as THREE.Material).dispose();
      this.trailLines.delete(objectId);
    }
  }

  /**
   * Removes all visualization elements (Keplerian line, trail line, prediction line)
   * associated with a given object ID from the scene and internal maps.
   *
   * Also cleans up related position history and predicted points data.
   * Calls `dispose` on geometry and materials.
   *
   * @param objectId - The ID of the object whose visualizations should be removed.
   */
  removeVisualization(objectId: string): void {
    this.keplerianManager.remove(objectId);

    this.removeTrailLine(objectId);

    const predictionLine = this.predictionLines.get(objectId);
    if (predictionLine) {
      this.objectManager.removeRawObjectFromScene(predictionLine);
      predictionLine.geometry.dispose();
      (predictionLine.material as THREE.Material).dispose();
      this.predictionLines.delete(objectId);
    }

    this.positionHistory.delete(objectId);
    this.predictedLinePoints.delete(objectId);
  }

  /**
   * Toggles the visibility of all currently managed visualization lines.
   *
   * @param visible - `true` to make lines visible, `false` to hide them.
   */
  toggleVisualization(): void {
    this.setVisibility(!this.visualizationVisible);
  }

  /**
   * Gets the current visibility state of the orbit visualizations.
   *
   * @returns `true` if visualizations are currently set to be visible, `false` otherwise.
   */
  isVisualizationVisible(): boolean {
    return this.visualizationVisible;
  }

  /**
   * Sets the visibility of all currently managed visualization lines.
   *
   * @param visible - `true` to make lines visible, `false` to hide them.
   */
  setVisibility(visible: boolean): void {
    if (visible === this.visualizationVisible) return;

    this.visualizationVisible = visible;

    this.keplerianManager.setVisibility(visible);

    const verletLines = new Map([...this.trailLines, ...this.predictionLines]);
    verletLines.forEach((line) => {
      line.visible = this.visualizationVisible;
    });
  }

  /**
   * Helper to apply highlight state to a line
   */
  private applyHighlight(objectId: string, line: THREE.Line): void {
    if (!(line.material instanceof THREE.LineBasicMaterial)) return;

    if (this.highlightedObjectId === objectId) {
      if (!line.userData.defaultColor) {
        line.userData.defaultColor = line.material.color.clone();
      }

      line.material.color.copy(this.highlightColor);
    } else if (line.userData.defaultColor) {
      line.material.color.copy(line.userData.defaultColor);
    }
  }

  /**
   * Sets the highlight state for a specific object's visualization lines.
   *
   * Only the lines corresponding to the *current* visualization mode are affected visually
   * (e.g., Keplerian line in Keplerian mode, trail line in Verlet mode).
   * Prediction lines are handled separately in the main update loop.
   *
   * @param objectId - The ID of the object to highlight, or `null` to clear the highlight.
   */
  highlightVisualization(objectId: string | null): void {
    const previouslyHighlightedId = this.highlightedObjectId;
    this.highlightedObjectId = objectId;

    if (previouslyHighlightedId && previouslyHighlightedId !== objectId) {
      this.keplerianManager.resetPreviousHighlight(
        previouslyHighlightedId,
        objectId,
      );

      const previousTrailLine = this.trailLines.get(previouslyHighlightedId);
      if (
        previousTrailLine &&
        previousTrailLine.material instanceof THREE.LineBasicMaterial &&
        previousTrailLine.userData.defaultColor
      ) {
        previousTrailLine.material.color.copy(
          previousTrailLine.userData.defaultColor,
        );
      }
    }

    if (objectId) {
      this.keplerianManager.applyHighlightToObject(
        objectId,
        objectId,
        this.highlightColor,
      );

      const trailLineToHighlight = this.trailLines.get(objectId);
      if (trailLineToHighlight) {
        this.applyHighlight(objectId, trailLineToHighlight);
      }
    }
  }

  /**
   * Cleans up resources used by the OrbitManager.
   *
   * Unsubscribes from listeners, removes all visualization lines from the scene,
   * disposes of their geometries and materials, and clears internal maps and caches.
   */
  dispose(): void {
    this.unsubscribeAdapterSettings?.unsubscribe();
    this.unsubscribeAdapterSettings = null;

    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;

    this.keplerianManager.dispose();

    // Clean up trail lines
    this.trailLines.forEach((line) => {
      this.objectManager.removeRawObjectFromScene(line);

      if (line.geometry) {
        line.geometry.dispose();
      }

      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      } else if (Array.isArray(line.material)) {
        line.material.forEach((mat) => mat.dispose());
      }
    });
    this.trailLines.clear();

    // Clean up prediction lines
    this.predictionLines.forEach((line) => {
      this.objectManager.removeRawObjectFromScene(line);

      if (line.geometry) {
        line.geometry.dispose();
      }

      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      } else if (Array.isArray(line.material)) {
        line.material.forEach((mat) => mat.dispose());
      }
    });
    this.predictionLines.clear();

    // Clear all cached data
    this.bufferCache.clear();

    // Clear all history and prediction data
    this.positionHistory.clear();
    this.predictedLinePoints.clear();

    this.highlightedObjectId = null;
  }

  /**
   * Helper to hide/remove prediction line visuals and stored points for an object ID.
   * Ensures prediction artifacts are cleaned up when an object is no longer highlighted
   * or when its prediction cannot be calculated.
   *
   * @param objectId - The ID of the object whose prediction line should be visually removed.
   * @private
   */
  private removePredictionLineVisually(objectId: string): void {
    const predictionLine = this.predictionLines.get(objectId);
    if (predictionLine) {
      predictionLine.visible = false;
    }
    this.predictedLinePoints.delete(objectId);
  }

  /**
   * Limits the memory usage of the position history by trimming history data
   * for objects that have accumulated too many points.
   *
   * This helps prevent memory leaks from accumulating position data over time.
   * Called periodically to ensure memory usage remains reasonable.
   */
  private limitHistoryDataMemory(): void {
    const visualSettings = this.stateAdapter.$visualSettings.getValue();
    const maxHistoryLength = 100 * visualSettings.trailLengthMultiplier;

    // Trim any history arrays that exceeded the maximum desired length
    this.positionHistory.forEach((history, id) => {
      if (history.length > maxHistoryLength) {
        // Keep only the most recent points up to the maximum length
        this.positionHistory.set(id, history.slice(-maxHistoryLength));
      }
    });

    // Clear prediction points for objects not currently highlighted
    // to avoid keeping unnecessary prediction data in memory
    if (this.highlightedObjectId) {
      this.predictedLinePoints.forEach((_, id) => {
        if (id !== this.highlightedObjectId) {
          this.predictedLinePoints.delete(id);
        }
      });
    }
  }
}
