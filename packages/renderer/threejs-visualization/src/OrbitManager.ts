import { type PhysicsStateReal } from "@teskooano/core-physics";
import { celestialObjectsStore } from "@teskooano/core-state";
import type {
  RenderableCelestialObject,
  RendererStateAdapter,
} from "@teskooano/renderer-threejs";
import type { MapStore } from "nanostores"; // Import MapStore
import * as THREE from "three";
import type { ObjectManager } from "./ObjectManager";
import { KeplerianOrbitManager } from "./orbit-manager";
import { predictVerletTrajectory } from "./orbit-manager/verlet-predictor"; // Import predictVerletTrajectory directly


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

const TRAIL_MATERIAL = new THREE.LineBasicMaterial({
  color: 0xffffff, // Changed to white
  linewidth: isMobileWidth ? 2 : 5, // Slightly thicker
  transparent: true,
  opacity: 1, // Slightly less transparent
  depthTest: true,
});

const PREDICTION_MATERIAL = new THREE.LineBasicMaterial({
  color: 0xff0000, // Red
  linewidth: isMobileWidth ? 2 : 5, // Slightly thicker
  transparent: true,
  opacity: 1,
  depthTest: true,
});

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
  private predictionDuration: number = 3600 * 12; // Default: 1 day
  /** Number of steps used in Verlet prediction calculation. Affects resolution. */
  private predictionSteps: number = 200;

  /** Stores the calculated points for the prediction line to avoid recalculation every frame, keyed by object ID. */
  private predictedLinePoints: Map<string, THREE.Vector3[]> = new Map();
  /** Counter used to throttle how often Verlet predictions are recalculated. */
  private predictionUpdateCounter: number = 0;
  /** Recalculate predictions every N calls to `updateAllVisualizations`. */
  private readonly predictionUpdateFrequency: number = 1; // Update prediction every frame

  /** Reference to the ObjectManager for adding/removing lines from the scene. */
  private objectManager: ObjectManager;
  /** Reference to the RendererStateAdapter for accessing visualization settings. */
  private stateAdapter: RendererStateAdapter;
  /** Reference to the store containing renderable object data. */
  private renderableObjectsStore: MapStore<
    Record<string, RenderableCelestialObject>
  >;

  /** Current visibility state of all managed visualization lines. */
  private visualizationVisible: boolean = true;
  /** ID of the currently highlighted celestial object, or null if none. */
  private highlightedObjectId: string | null = null;
  /** Color used to highlight orbit/trail/prediction lines. */
  private highlightColor: THREE.Color = new THREE.Color(0xffff00); // Yellow

  /** The current active visualization mode (`Keplerian` or `Verlet`). */
  private currentMode: VisualizationMode = VisualizationMode.Keplerian;
  /** Unsubscribe function for the adapter settings listener. */
  private unsubscribeAdapterSettings: (() => void) | null = null;

  /** Add instance of the new manager */
  private keplerianManager: KeplerianOrbitManager;

  /**
   * Creates an instance of OrbitManager.
   *
   * @param objectManager - The scene's `ObjectManager` instance.
   * @param stateAdapter - The `RendererStateAdapter` for accessing visual settings.
   * @param renderableObjectsStore - The Nanostore containing `RenderableCelestialObject` data.
   */
  constructor(
    objectManager: ObjectManager,
    stateAdapter: RendererStateAdapter, // Keep adapter for visual settings
    renderableObjectsStore: MapStore<Record<string, RenderableCelestialObject>>, // Add store parameter
  ) {
    this.objectManager = objectManager;
    this.stateAdapter = stateAdapter;
    this.renderableObjectsStore = renderableObjectsStore; // Assign store

    // Instantiate the Keplerian manager
    this.keplerianManager = new KeplerianOrbitManager(
      objectManager,
      renderableObjectsStore,
    );

    // Subscribe to physics engine changes FROM THE ADAPTER
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

    // Set initial mode based on adapter's initial state
    const initialSettings = this.stateAdapter.$visualSettings.get();
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

    // Clear visualizations from the previous mode
    if (mode === VisualizationMode.Verlet) {
      // Delegate clearing to the Keplerian manager
      this.keplerianManager.clearAll();
    } else {
      // Switching to Keplerian
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
    const objects = this.renderableObjectsStore.get();
    const visualSettings = this.stateAdapter.$visualSettings.get();

    this.cleanupRemovedObjects(objects);

    if (this.currentMode === VisualizationMode.Keplerian) {
      Object.values(objects).forEach((obj) => {
        if (obj.orbit && obj.parentId) {
          // Delegate to KeplerianOrbitManager
          this.keplerianManager.createOrUpdate(
            obj.celestialObjectId,
            obj.orbit,
            obj.parentId,
            this.visualizationVisible, // Pass current visibility
            this.highlightedObjectId, // Pass current highlight ID
            this.highlightColor, // Pass highlight color
          );
        } else if (this.keplerianManager.lines.has(obj.celestialObjectId)) {
          // If object no longer has orbit/parent, remove its line via manager
          this.keplerianManager.remove(obj.celestialObjectId);
        }
      });
    } else {
      // Verlet Mode
      Object.values(objects).forEach((obj) => {
        this.createOrUpdateVerletTrail(obj.celestialObjectId, obj);
      });

      // --- Verlet Prediction Update ---
      // Increment frame counter for prediction throttling
      this.predictionUpdateCounter++;
      const shouldUpdatePredictions =
        this.predictionUpdateCounter >= this.predictionUpdateFrequency;

      if (shouldUpdatePredictions) {
        this.predictionUpdateCounter = 0; // Reset counter
      }

      // Get the full state for prediction calculation
      const fullObjectsMap = celestialObjectsStore.get();
      const allCurrentPhysicsStates = Object.values(fullObjectsMap)
        .map((co) => co.physicsStateReal)
        .filter((state): state is PhysicsStateReal => !!state); // Filter out any undefined states

      Object.values(objects).forEach((renderableObj) => {
        const targetId = renderableObj.celestialObjectId;
        const fullTargetObject = fullObjectsMap[targetId];

        // --- Prediction Logic (only for highlighted object) ---
        if (targetId === this.highlightedObjectId) {
          // Only proceed if highlighted object has physics state
          if (fullTargetObject?.physicsStateReal) {
            if (shouldUpdatePredictions) {
              // Time to recalculate
              const otherPhysicsStates = allCurrentPhysicsStates.filter(
                (state) => state.id !== targetId,
              );
              const newPredictionPoints = predictVerletTrajectory(
                [fullTargetObject.physicsStateReal, ...otherPhysicsStates],
                this.predictionDuration,
                this.predictionSteps,
              );
              this.predictedLinePoints.set(targetId, newPredictionPoints);
              this.updatePredictionLine(targetId, newPredictionPoints);
            } else {
              // Use stored points
              const storedPoints = this.predictedLinePoints.get(targetId);
              if (storedPoints) {
                this.updatePredictionLine(targetId, storedPoints);
              } else {
                // If no stored points yet, calculate them now even if not on frequency
                // This handles the case where an object is newly highlighted
                const otherPhysicsStates = allCurrentPhysicsStates.filter(
                  (state) => state.id !== targetId,
                );
                const initialPoints = predictVerletTrajectory(
                  [fullTargetObject.physicsStateReal, ...otherPhysicsStates],
                  this.predictionDuration,
                  this.predictionSteps,
                );
                this.predictedLinePoints.set(targetId, initialPoints);
                this.updatePredictionLine(targetId, initialPoints);
              }
            }
            // Ensure the line is visible if it exists
            const predictionLine = this.predictionLines.get(targetId);
            if (predictionLine)
              predictionLine.visible = this.visualizationVisible;
          } else {
            // Highlighted object lacks physics state, remove prediction
            this.removePredictionLineVisually(targetId);
          }
        } else {
          // This object is NOT highlighted, remove/hide its prediction line
          this.removePredictionLineVisually(targetId);
        }
        // --- End Prediction Logic ---
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
    // Check Keplerian lines via manager
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

  // --- Verlet Mode Methods --- //

  /**
   * Updates the position history for a specific object and triggers an update
   * of its Verlet trail line. The length of the trail is determined by the
   * `trailLengthMultiplier` setting in the `RendererStateAdapter`.
   *
   * @param id - The ID of the object to update the trail for.
   * @param obj - The `RenderableCelestialObject` containing the current position.
   * @internal Called by `updateAllVisualizations` when in Verlet mode.
   */
  createOrUpdateVerletTrail(id: string, obj: RenderableCelestialObject): void {
    const multiplier =
      this.stateAdapter.$visualSettings.get().trailLengthMultiplier;
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
    this.updateTrailLine(id, history, maxHistoryLength);
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
  ): void {
    let line = this.trailLines.get(id);
    const safeMaxPoints = Math.max(1, Math.floor(maxPoints));

    // --- REVERTED: Remove Smoothing Logic ---
    // Use raw points directly
    const pointsToUse = points;
    // --- End Revert ---

    if (!line) {
      // Revert buffer size logic to original
      const bufferSize = safeMaxPoints;
      if (bufferSize <= 0) {
        return;
      }
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(bufferSize * 3);
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setDrawRange(0, 0);
      line = new THREE.Line(geometry, TRAIL_MATERIAL.clone());
      line.name = `trail-line-${id}`;
      line.frustumCulled = false;
      this.objectManager.addRawObjectToScene(line);
      this.trailLines.set(id, line);
    } else {
      const geometry = line.geometry;
      let positionAttribute = geometry.attributes
        .position as THREE.BufferAttribute;
      const existingCapacity = positionAttribute.count;
      // Revert buffer size logic to original
      const requiredCapacity = safeMaxPoints;

      if (existingCapacity < requiredCapacity) {
        const newPositions = new Float32Array(requiredCapacity * 3);
        newPositions.set(
          positionAttribute.array.slice(0, existingCapacity * 3),
        );
        geometry.deleteAttribute("position");
        positionAttribute = new THREE.BufferAttribute(newPositions, 3);
        geometry.setAttribute("position", positionAttribute);
        geometry.setDrawRange(0, requiredCapacity); // Use required capacity
      }

      // Use pointsToUse (which is now the raw points array)
      const pointsToDraw = Math.min(pointsToUse.length, positionAttribute.count);
      for (let i = 0; i < pointsToDraw; i++) {
        pointsToUse[i].toArray(positionAttribute.array, i * 3);
      }

      positionAttribute.needsUpdate = true;
      geometry.setDrawRange(0, pointsToDraw);
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
      if (this.predictionLines.has(id)) this.removeVisualization(id); // Remove prediction if not enough points
      return;
    }
    let line = this.predictionLines.get(id);
    const maxPoints = this.predictionSteps; // Use the known max steps

    if (!line) {
      // Initialize geometry with max capacity
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(maxPoints * 3);
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setDrawRange(0, 0); // Initially draw nothing

      line = new THREE.Line(geometry, PREDICTION_MATERIAL.clone()); // Clone material
      line.name = `prediction-line-${id}`;
      line.frustumCulled = false;
      this.objectManager.addRawObjectToScene(line);
      this.predictionLines.set(id, line);
    }

    // Update existing geometry attribute
    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;

    // Copy points into the buffer (ensure we don't exceed maxPoints)
    const numPointsToCopy = Math.min(points.length, maxPoints);
    for (let i = 0; i < numPointsToCopy; i++) {
      points[i].toArray(positionAttribute.array, i * 3);
    }

    positionAttribute.needsUpdate = true; // Mark the attribute as needing update
    geometry.setDrawRange(0, numPointsToCopy); // Set the range to draw based on actual points copied
    geometry.computeBoundingSphere(); // Compute bounding sphere for predictions (might be useful)

    // Ensure the intended default color is stored before applying highlight
    if (
      !line.userData.defaultColor ||
      line.userData.defaultColor.getHex() !== PREDICTION_MATERIAL.color.getHex()
    ) {
      line.userData.defaultColor = PREDICTION_MATERIAL.color.clone();
    }

    line.visible = this.visualizationVisible;
    this.applyHighlight(id, line); // Apply highlight to prediction line
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

  // --- Shared Methods --- //

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
    // Delegate Keplerian line removal
    this.keplerianManager.remove(objectId);

    this.removeTrailLine(objectId); // Use helper

    const predictionLine = this.predictionLines.get(objectId);
    if (predictionLine) {
      this.objectManager.removeRawObjectFromScene(predictionLine);
      predictionLine.geometry.dispose();
      (predictionLine.material as THREE.Material).dispose();
      this.predictionLines.delete(objectId);
    }

    this.positionHistory.delete(objectId); // Remove trail history
    this.predictedLinePoints.delete(objectId); // Remove stored prediction points
  }

  /**
   * Toggles the visibility of all currently managed visualization lines.
   *
   * @param visible - `true` to make lines visible, `false` to hide them.
   */
  toggleVisualization(): void {
    // Use the new setVisibility method to avoid duplicating logic
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
    if (visible === this.visualizationVisible) return; // No change needed

    this.visualizationVisible = visible;
    // Delegate visibility setting
    this.keplerianManager.setVisibility(visible);
    // Set visibility for Verlet lines
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
        // Store the line's original default color before applying highlight
        line.userData.defaultColor = line.material.color.clone();
      }
      // CORRECT: Apply the color directly to the provided line (Verlet trail/prediction)
      line.material.color.copy(this.highlightColor);
    } else if (line.userData.defaultColor) {
      // Reset to default color if not highlighted or highlight cleared
      line.material.color.copy(line.userData.defaultColor);
    } // else: No default color stored, likely already the default material color
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

    // Reset previous highlight
    if (previouslyHighlightedId && previouslyHighlightedId !== objectId) {
      // Reset Keplerian via manager
      this.keplerianManager.resetPreviousHighlight(
        previouslyHighlightedId,
        objectId,
      );
      // Reset Verlet (trails) directly
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

    // Apply new highlight
    if (objectId) {
      // Delegate Keplerian highlight
      this.keplerianManager.applyHighlightToObject(
        objectId,
        objectId,
        this.highlightColor,
      );
      // Apply Verlet (trail) highlight directly
      const trailLineToHighlight = this.trailLines.get(objectId);
      if (trailLineToHighlight) {
        this.applyHighlight(objectId, trailLineToHighlight); // Use existing private helper for this map
      }
    }
  }

  /**
   * Cleans up resources used by the OrbitManager.
   *
   * Unsubscribes from listeners, removes all visualization lines from the scene,
   * disposes of their geometries and materials, and clears internal maps.
   */
  dispose(): void {
    // Unsubscribe from adapter settings
    this.unsubscribeAdapterSettings?.();
    this.unsubscribeAdapterSettings = null;

    // Remove all visualizations
    // Delegate Keplerian cleanup
    this.keplerianManager.dispose();

    this.trailLines.forEach((line, id) => this.removeVisualization(id)); // This will call removeTrailLine
    this.trailLines.clear();
    this.predictionLines.forEach((line, id) => this.removeVisualization(id)); // This will call removePredictionLineVisually

    // Reset the highlighted object ID
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
      predictionLine.visible = false; // Just hide it
    }
    this.predictedLinePoints.delete(objectId); // Remove stored points
  }
}
