import { type OrbitalParameters, CelestialType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import type { Observable } from "rxjs";
import * as THREE from "three";
import { OrbitCalculator } from "./OrbitCalculator";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import { ThreeVector3Converter } from "@teskooano/data-types"; // Corrected import
import { type OSVector3 } from "@teskooano/core-math";
import { TrailCurveInterpolator } from "../renderers/TrailCurveInterpolator";
import {
  TrailCurveType,
  type TrailCurveConfig,
} from "../renderers/TrailManager";

/**
 * Manages the creation, update, visibility, and highlighting of static Keplerian orbit lines.
 *
 * This class is responsible for maintaining and rendering the classic elliptical orbit paths
 * based on Keplerian orbital elements. It works with the ObjectManager to add/remove lines
 * from the scene and handles visual properties like highlighting and visibility.
 *
 * Enhanced with curved trail interpolation for more realistic orbital visualization.
 */
export class KeplerianManager extends StateSubscriptionMixin {
  /** Map storing static Keplerian orbit lines, keyed by celestial object ID. */
  private lines: Map<string, THREE.Line> = new Map();

  /** Cache for THREE.Vector3 arrays to avoid reallocation */
  private positionCache: Map<string, THREE.Vector3[]> = new Map();
  /**
   * Cache for the raw calculated OSVector3 points to avoid recalculation.
   * The number is a version based on a key orbital parameter to check for changes.
   */
  private orbitPointCache: Map<
    string,
    { version: number; points: OSVector3[] }
  > = new Map();

  /** Object manager for adding/removing objects from the scene */
  private objectManager: ObjectManager;

  /** Observable for renderable object updates */
  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  /** Latest state of renderable objects */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** Line builder utility for efficient line creation and update */
  private lineBuilder: LineHelper;

  /** Converter for OSVector3 to THREE.Vector3 arrays */
  private threeVector3Converter: ThreeVector3Converter; // New instance

  /** Curve configuration for Keplerian orbit interpolation */
  private curveConfig: TrailCurveConfig = {
    type: TrailCurveType.Orbital,
    tension: 0.3,
    segments: 4,
    smoothing: 0.2,
    adaptiveThreshold: 5,
  };

  /** Group for all orbit lines to manage visibility and highlighting collectively */
  private orbitLinesGroup: THREE.Group;
  /** Dedicated group for keplerian lines within the orbit lines group */
  private keplerianLinesGroup: THREE.Group;

  /**
   * Creates an instance of KeplerianManager.
   *
   * @param objectManager - The scene's ObjectManager instance.
   * @param renderableObjects$ - An Observable emitting RenderableCelestialObject data.
   * @param orbitLinesGroup - Shared group for all orbit-related lines
   * @param curveConfig - Optional curve configuration for orbit interpolation
   */
  constructor(
    objectManager: ObjectManager,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    orbitLinesGroup: THREE.Group,
    curveConfig?: TrailCurveConfig,
  ) {
    super();
    this.objectManager = objectManager;
    this.renderableObjects$ = renderableObjects$;
    this.lineBuilder = new LineHelper();
    this.threeVector3Converter = new ThreeVector3Converter(); // Initialize converter
    this.orbitLinesGroup = orbitLinesGroup; // Use the shared group

    if (curveConfig) {
      this.curveConfig = { ...this.curveConfig, ...curveConfig };
    }

    // Create a dedicated group for keplerian lines within the orbit lines group
    this.keplerianLinesGroup = new THREE.Group();
    this.keplerianLinesGroup.name = "GROUP_KEPLERIAN_LINES";
    this.orbitLinesGroup.add(this.keplerianLinesGroup);

    // Subscribe to renderable objects stream
    this.subscribeToState(this.renderableObjects$, (objects) => {
      this.latestRenderableObjects = objects;
    });
  }

  /**
   * Sets the curve configuration for Keplerian orbit interpolation.
   * @param config - The new curve configuration
   */
  setCurveConfig(config: TrailCurveConfig): void {
    this.curveConfig = { ...this.curveConfig, ...config };
  }

  /**
   * Gets the current curve configuration.
   * @returns The current curve configuration
   */
  getCurveConfig(): TrailCurveConfig {
    return { ...this.curveConfig };
  }

  /**
   * Creates or updates a static Keplerian orbit line for a given object.
   *
   * @param objectId - The unique ID of the celestial object whose orbit is being drawn.
   * @param orbitalParameters - The OrbitalParameters for the object.
   * @param parentId - The ID of the parent object around which this object orbits.
   * @param isVisible - The current visibility state for orbit lines.
   * @param highlightedObjectId - The ID of the currently highlighted object (or null).
   * @param highlightColor - The color to use for highlighting.
   */
  createOrUpdate(
    objectId: string,
    orbitalParameters: OrbitalParameters,
    parentId: string,
    isVisible: boolean,
    highlightedObjectId: string | null,
    highlightColor: THREE.Color,
  ): void {
    const existingLine = this.lines.get(objectId);
    const parentObject3D = this.objectManager.getObject(parentId);
    const allRenderableObjects = this.latestRenderableObjects;
    const parentState = allRenderableObjects[parentId];
    const objectState = allRenderableObjects[objectId];

    if (!parentObject3D || !parentState) {
      if (existingLine) this.remove(objectId);
      return;
    }

    // Get parent position
    const parentWorldPosition = new THREE.Vector3();
    parentObject3D.getWorldPosition(parentWorldPosition);

    // --- Orbit Point Calculation & Caching ---
    let orbitPointsOS: OSVector3[];
    const cachedData = this.orbitPointCache.get(objectId);
    const currentVersion = orbitalParameters.realSemiMajorAxis_m;

    if (cachedData && cachedData.version === currentVersion) {
      orbitPointsOS = cachedData.points;
    }
    // If the orbit has fundamentally changed or not cached, recalculate.
    else {
      orbitPointsOS = OrbitCalculator.calculateOrbitPoints(
        orbitalParameters,
        objectState,
      );
      this.orbitPointCache.set(objectId, {
        version: currentVersion,
        points: orbitPointsOS,
      });
    }
    // --- End Caching ---

    // Efficiently update or create the THREE.Vector3 array
    const cachedPositions = this.positionCache.get(objectId) ?? [];
    const orbitPointsTHREE = this.threeVector3Converter.update(
      orbitPointsOS,
      cachedPositions,
    );
    this.positionCache.set(objectId, orbitPointsTHREE);

    if (orbitPointsTHREE.length === 0) {
      if (existingLine) this.remove(objectId);
      return;
    }

    // Apply curve interpolation to Keplerian orbit points
    const interpolatedPoints = TrailCurveInterpolator.interpolate(
      orbitPointsTHREE,
      this.curveConfig,
    );

    // Choose the appropriate material based on type
    const isMoon = parentState.type !== CelestialType.STAR;
    const materialType = isMoon ? "KEPLERIAN_MOON" : "KEPLERIAN";

    if (existingLine) {
      // Update existing line
      this.lineBuilder.updateLine(
        existingLine,
        interpolatedPoints,
        interpolatedPoints.length,
      );
      existingLine.position.copy(parentWorldPosition);
      existingLine.visible = isVisible;

      this.applyHighlight(
        objectId,
        existingLine,
        highlightedObjectId,
        highlightColor,
      );
    } else {
      // Create new line
      const material = SharedMaterials.clone(materialType);

      const newLine = this.lineBuilder.createLine(
        interpolatedPoints.length,
        material,
        `orbit-line-${objectId}`,
      );

      // Update the line with the interpolated points
      this.lineBuilder.updateLine(
        newLine,
        interpolatedPoints,
        interpolatedPoints.length,
      );

      newLine.position.copy(parentWorldPosition);
      newLine.visible = isVisible;
      newLine.frustumCulled = true;

      // Apply correct render order for Keplerian orbits
      newLine.renderOrder =
        RenderOrderManager.getRenderOrderForOrbit("keplerian");

      // Orbit lines need to be positioned in absolute world space, not relative to celestial objects
      // So we add them directly to the scene
      this.keplerianLinesGroup.add(newLine);

      this.lines.set(objectId, newLine);

      this.applyHighlight(
        objectId,
        newLine,
        highlightedObjectId,
        highlightColor,
      );
    }
  }

  /**
   * Removes a specific Keplerian orbit line from the scene and internal tracking.
   *
   * @param objectId - The ID of the object whose line should be removed.
   */
  remove(objectId: string): void {
    const line = this.lines.get(objectId);
    if (line) {
      // Remove from scene directly since orbit lines are positioned in absolute world space
      this.keplerianLinesGroup.remove(line);

      this.lineBuilder.disposeLine(line);
      this.lines.delete(objectId);
      this.positionCache.delete(objectId);
      this.orbitPointCache.delete(objectId);
    }
  }

  /**
   * Removes all managed Keplerian lines.
   */
  clearAll(): void {
    this.lines.forEach((_, id) => this.remove(id));
    this.lines.clear();
  }

  /**
   * Sets the visibility of all managed Keplerian lines.
   *
   * @param visible - True to make lines visible, false to hide.
   */
  setVisibility(visible: boolean): void {
    this.keplerianLinesGroup.children.forEach((child) => {
      child.visible = visible;
    });
  }

  /**
   * Applies or removes the highlight effect for a specific object's line.
   *
   * @param targetObjectId - The ID of the object to potentially highlight or unhighlight.
   * @param highlightedObjectId - The ID currently being highlighted (or null).
   * @param highlightColor - The color for highlighting.
   */
  applyHighlightToObject(
    targetObjectId: string,
    highlightedObjectId: string | null,
    highlightColor: THREE.Color,
  ): void {
    const line = this.lines.get(targetObjectId);
    if (line) {
      this.applyHighlight(
        targetObjectId,
        line,
        highlightedObjectId,
        highlightColor,
      );
    }
  }

  /**
   * Resets the highlight on a previously highlighted line if it's no longer the target.
   *
   * @param previouslyHighlightedId - The ID that was previously highlighted.
   * @param currentHighlightedId - The ID currently being highlighted (or null).
   */
  resetPreviousHighlight(
    previouslyHighlightedId: string,
    currentHighlightedId: string | null,
  ): void {
    if (
      previouslyHighlightedId &&
      previouslyHighlightedId !== currentHighlightedId
    ) {
      const previousLine = this.lines.get(previouslyHighlightedId);
      if (
        previousLine &&
        previousLine.material instanceof THREE.LineBasicMaterial &&
        previousLine.userData.defaultColor
      ) {
        previousLine.material.color.copy(previousLine.userData.defaultColor);
      }
    }
  }

  /**
   * Helper to apply highlight state to a single line.
   *
   * @param lineObjectId - The ID of the object this line belongs to.
   * @param line - The line object itself.
   * @param highlightedObjectId - The ID currently being highlighted (or null).
   * @param highlightColor - The color for highlighting.
   * @private
   */
  private applyHighlight(
    lineObjectId: string,
    line: THREE.Line,
    highlightedObjectId: string | null,
    highlightColor: THREE.Color,
  ): void {
    if (!(line.material instanceof THREE.LineBasicMaterial)) return;

    if (highlightedObjectId === lineObjectId) {
      if (!line.userData.defaultColor) {
        line.userData.defaultColor = line.material.color.clone();
      }
      line.material.color.copy(highlightColor);
    } else if (line.userData.defaultColor) {
      line.material.color.copy(line.userData.defaultColor);
    }
  }

  /**
   * Checks if a line exists for the given object ID.
   *
   * @param objectId - ID of the object to check
   * @returns True if a line exists for the object
   */
  hasLine(objectId: string): boolean {
    return this.lines.has(objectId);
  }

  /**
   * Disposes of all resources and cleans up internal state.
   */
  dispose(): void {
    super.dispose();
    this.lineBuilder.clear();

    // Clear the orbit lines group
    while (this.keplerianLinesGroup.children.length > 0) {
      this.keplerianLinesGroup.remove(this.keplerianLinesGroup.children[0]);
    }
  }
}
