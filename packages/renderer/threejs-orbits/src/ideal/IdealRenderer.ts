import * as THREE from "three";
import { type RenderableCelestialObject } from "@teskooano/data-types";
import { type ObjectManager } from "@teskooano/renderer-threejs-objects";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import type { Observable } from "rxjs";
import { OrbitCalculator } from "./OrbitCalculator";
import { SharedMaterials } from "../shared/SharedMaterials";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import { ThreeVector3Converter } from "@teskooano/data-values";
import { type OSVector3 } from "@teskooano/core-math";
import { TrailCurveInterpolator } from "../shared/TrailCurveInterpolator";
import {
  TrailCurveType,
  type TrailCurveConfig,
} from "../shared/TrailCurveConfig";

/**
 * Renders perfect elliptical orbits based on analytical Keplerian orbital parameters.
 *
 * This renderer creates static orbit lines that represent the perfect mathematical
 * paths of celestial objects in an idealized gravitational system where only the
 * primary gravitational influence is considered.
 */
export class IdealRenderer extends StateSubscriptionMixin {
  /** Map storing static Keplerian orbit lines, keyed by celestial object ID */
  private lines: Map<string, THREE.Line> = new Map();

  /** Cache for THREE.Vector3 arrays to avoid reallocation */
  private positionCache: Map<string, THREE.Vector3[]> = new Map();

  /** Cache for the raw calculated OSVector3 points to avoid recalculation */
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
  private threeVector3Converter: ThreeVector3Converter;

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

  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;

  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);

  /** Flag indicating if orbit visualizations are visible */
  private isVisible: boolean = true;

  /**
   * Creates a new IdealRenderer instance.
   *
   * @param objectManager - The scene's ObjectManager instance
   * @param renderableObjects$ - An Observable emitting RenderableCelestialObject data
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
    this.threeVector3Converter = new ThreeVector3Converter();
    this.orbitLinesGroup = orbitLinesGroup;

    if (curveConfig) {
      this.curveConfig = { ...this.curveConfig, ...curveConfig };
    }

    // Subscribe to renderable objects stream
    this.subscribeToState(this.renderableObjects$, (objects) => {
      this.latestRenderableObjects = objects;
    });
  }

  /**
   * Sets the curve configuration for Keplerian orbit interpolation.
   */
  setCurveConfig(config: TrailCurveConfig): void {
    this.curveConfig = { ...this.curveConfig, ...config };
  }

  /**
   * Gets the current curve configuration.
   */
  getCurveConfig(): TrailCurveConfig {
    return { ...this.curveConfig };
  }

  /**
   * Updates all orbit visualizations based on the current objects.
   */
  update(
    objects: Record<string, RenderableCelestialObject>,
    visualSettings: {
      timeScale: number;
      predictionSteps: number;
      predictionDuration: number;
    },
    deltaTime: number,
  ): void {
    if (!this.isVisible) return;

    Object.values(objects).forEach((obj) => {
      if (obj.orbit && obj.parentId) {
        this.createOrUpdate(
          obj.id,
          obj.orbit,
          obj.parentId,
          this.isVisible,
          this.highlightedObjectId,
          this.highlightColor,
        );
      } else if (this.lines.has(obj.id)) {
        this.remove(obj.id);
      }
    });
  }

  /**
   * Creates or updates a static Keplerian orbit line for a given object.
   */
  createOrUpdate(
    objectId: string,
    orbitalParameters: any,
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
    } else {
      orbitPointsOS = OrbitCalculator.calculateOrbitPoints(
        orbitalParameters,
        objectState,
      );
      this.orbitPointCache.set(objectId, {
        version: currentVersion,
        points: orbitPointsOS,
      });
    }

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
    const isMoon = parentState.type !== "STAR";
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

      this.lineBuilder.updateLine(
        newLine,
        interpolatedPoints,
        interpolatedPoints.length,
      );

      newLine.position.copy(parentWorldPosition);
      newLine.visible = isVisible;
      newLine.frustumCulled = true;

      newLine.renderOrder =
        RenderOrderManager.getRenderOrderForOrbit("keplerian");

      this.orbitLinesGroup.add(newLine);
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
   * Highlights a specific object's orbit visualization.
   */
  highlight(objectId: string | null, color: THREE.Color): void {
    const previouslyHighlightedId = this.highlightedObjectId;
    this.highlightedObjectId = objectId;
    this.highlightColor = color;

    if (previouslyHighlightedId && previouslyHighlightedId !== objectId) {
      this.resetPreviousHighlight(previouslyHighlightedId, objectId);
    }

    if (objectId) {
      this.applyHighlightToObject(objectId, objectId, color);
    } else if (previouslyHighlightedId) {
      this.resetPreviousHighlight(previouslyHighlightedId, null);
    }
  }

  /**
   * Sets the visibility of all orbit visualizations.
   */
  setVisibility(visible: boolean): void {
    this.isVisible = visible;
    this.orbitLinesGroup.children.forEach((child) => {
      child.visible = visible;
    });
  }

  /**
   * Sets the visibility of trajectory prediction visualizations.
   * This is a no-op in the Ideal renderer as it doesn't use separate prediction lines.
   */
  setPredictionVisibility(visible: boolean): void {
    // This renderer does not have prediction lines
  }

  /**
   * Removes a specific Keplerian orbit line from the scene and internal tracking.
   */
  remove(objectId: string): void {
    const line = this.lines.get(objectId);
    if (line) {
      this.orbitLinesGroup.remove(line);
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
   * Applies or removes the highlight effect for a specific object's line.
   */
  private applyHighlightToObject(
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
   */
  private resetPreviousHighlight(
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
   */
  hasLine(objectId: string): boolean {
    return this.lines.has(objectId);
  }

  /**
   * Cleans up resources used by this renderer.
   */
  dispose(): void {
    super.dispose();
    this.lineBuilder.clear();
    this.clearAll();
  }
}
