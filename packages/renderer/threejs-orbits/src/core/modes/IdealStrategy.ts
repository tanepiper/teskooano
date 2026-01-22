import type { IOrbitVisualizationStrategy } from "./IOrbitVisualizationStrategy";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { KeplerianManager } from "../../keplerian/KeplerianManager";
import { TrailCurveType } from "../../renderers/TrailManager";
import * as THREE from "three";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { Observable } from "rxjs";

/**
 * Implementation of the orbit visualization strategy for Ideal (Keplerian) mode.
 *
 * This strategy renders perfect elliptical orbits based on analytical Keplerian
 * orbital parameters. It creates static orbit lines that represent the perfect
 * mathematical paths of celestial objects in an idealized gravitational system
 * where only the primary gravitational influence is considered.
 */
export class IdealStrategy implements IOrbitVisualizationStrategy {
  /** Manager for creating and updating Keplerian orbit lines */
  private keplerianManager: KeplerianManager;
  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;
  /** Visibility state for all orbit lines */
  private isVisible: boolean = true;
  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);

  /**
   * Creates a new IdealStrategy instance.
   *
   * @param objectManager - The scene's ObjectManager for rendering operations
   * @param renderableObjects$ - Observable stream of renderable object data
   * @param orbitLinesGroup - Shared group for all orbit-related lines
   */
  constructor(
    objectManager: ObjectManager,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    orbitLinesGroup: THREE.Group,
  ) {
    this.keplerianManager = new KeplerianManager(
      objectManager,
      renderableObjects$,
      orbitLinesGroup,
      {
        type: TrailCurveType.Orbital,
        tension: 0.3,
        segments: 4,
        smoothing: 0.2,
        adaptiveThreshold: 5,
      },
    );
  }

  /**
   * Updates all orbit visualizations based on the current objects.
   *
   * For each object with orbital parameters, creates or updates a perfect
   * elliptical orbit line. Removes orbit lines for objects that no longer
   * have orbital parameters.
   *
   * @param objects - Map of all renderable celestial objects by ID
   * @param visualSettings - Current visual settings (not used in this strategy)
   * @param deltaTime - Time elapsed since last update (not used in this strategy)
   */
  update(
    objects: Record<string, RenderableCelestialObject>,
    visualSettings: {
      timeScale: number;
      predictionSteps: number;
      predictionDuration: number;
      keplerOrbitMode: "full" | "trail";
    },
    deltaTime: number,
  ): void {
    if (!this.isVisible) return;
    Object.values(objects).forEach((obj) => {
      if (obj.orbit && obj.parentId) {
        this.keplerianManager.createOrUpdate(
          obj.id,
          obj.orbit,
          obj.parentId,
          this.isVisible,
          this.highlightedObjectId,
          this.highlightColor,
          visualSettings.keplerOrbitMode,
        );
      } else if (this.keplerianManager.hasLine(obj.id)) {
        this.keplerianManager.remove(obj.id);
      }
    });
  }

  /**
   * Highlights a specific object's orbit visualization.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlighting
   * @param color - Color to use for highlighting
   */
  highlight(objectId: string | null, color: THREE.Color): void {
    const previouslyHighlightedId = this.highlightedObjectId;
    this.highlightedObjectId = objectId;
    this.highlightColor = color;

    if (previouslyHighlightedId && previouslyHighlightedId !== objectId) {
      this.keplerianManager.resetPreviousHighlight(
        previouslyHighlightedId,
        objectId,
      );
    }

    if (objectId) {
      this.keplerianManager.applyHighlightToObject(objectId, objectId, color);
    } else if (previouslyHighlightedId) {
      this.keplerianManager.resetPreviousHighlight(
        previouslyHighlightedId,
        null,
      );
    }
  }

  /**
   * Sets the visibility of all orbit visualizations.
   *
   * @param visible - Whether orbit visualizations should be visible
   */
  setVisibility(visible: boolean): void {
    this.isVisible = visible;
    this.keplerianManager.setVisibility(visible);
  }

  /**
   * Clears all orbital trails (Keplerian orbit lines).
   */
  clearAllTrails(): void {
    this.keplerianManager.clearAll();
  }

  /**
   * Clears all prediction lines.
   * This is a no-op in the Ideal strategy as it doesn't use separate prediction lines.
   */
  clearAllPredictions(): void {
    // This strategy does not have prediction lines.
  }

  /**
   * Cleans up resources used by this strategy.
   */
  dispose(): void {
    this.keplerianManager.dispose();
  }

  /**
   * Sets the visibility of trajectory prediction visualizations.
   * This is a no-op in the Ideal strategy as it doesn't use separate prediction lines.
   *
   * @param visible - Whether prediction visualizations should be visible
   */
  public setPredictionVisibility(visible: boolean): void {
    // This strategy does not have prediction lines.
  }
}
