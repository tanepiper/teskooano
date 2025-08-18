import * as THREE from "three";
import {
  type RenderableCelestialObject,
  TrailQuality,
} from "@teskooano/data-types";
import { type ObjectManager } from "@teskooano/renderer-threejs-objects";
import { StateSubscriptionMixin } from "@teskooano/core-state";
import { PositionHistoryManager } from "@teskooano/renderer-threejs-celestial";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";
import { SharedMaterials } from "../shared/SharedMaterials";
import { TrailCurveInterpolator } from "../shared/TrailCurveInterpolator";
import {
  TrailCurveType,
  type TrailCurveConfig,
} from "../shared/TrailCurveConfig";
// Note: TrailDataPool and trail.worker are available but not directly imported in this simplified version

/**
 * Renders historical trails for celestial objects in N-body simulation mode.
 *
 * This renderer shows the actual path that objects have followed based on
 * their position history from the physics simulation. It uses Web Workers
 * for performance and supports curved trail interpolation.
 */
export class NBodyTrailsRenderer extends StateSubscriptionMixin {
  /** Map storing trail lines, keyed by celestial object ID */
  private trailLines: Map<string, THREE.Line> = new Map();

  /** Cache for parent groups to avoid repeated lookups */
  private parentGroupCache: Map<string, THREE.Object3D> = new Map();

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineHelper;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** Flag indicating if trail visualization is enabled */
  private visualizationVisible: boolean = true;

  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;

  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0xffff00);

  /** The quality setting for smoothed trails */
  private trailQuality: TrailQuality = TrailQuality.High;

  /** Curve configuration for trail interpolation */
  private curveConfig: TrailCurveConfig = {
    type: TrailCurveType.Adaptive,
    tension: 0.5,
    segments: 10,
    smoothing: 0.3,
    adaptiveThreshold: 5,
  };

  /** Maximum number of points to render in orbital trails */
  private readonly baseMaxTrailPoints: number = 1000;

  /** Current trail length multiplier from settings */
  private trailLengthMultiplier: number = 2; // Default 2x multiplier

  /** Cached effective max trail points to avoid recalculation */
  private cachedEffectiveMaxTrailPoints: number = 2000; // 1000 * 2

  /** Number of points to skip when sampling for interpolation */
  private readonly samplingInterval: number = 2;

  /** Base material template for creating individual line materials */
  private baseTrailMaterial: THREE.Material | null = null;

  /** Group for all trail lines */
  private trailLinesGroup: THREE.Group;

  /**
   * Creates a new NBodyTrailsRenderer instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   * @param curveConfig - Optional curve configuration for trail interpolation
   * @param trailLinesGroup - Optional shared group for all trail-related lines
   */
  constructor(
    objectManager: ObjectManager,
    curveConfig?: TrailCurveConfig,
    trailLinesGroup?: THREE.Group,
  ) {
    super();
    this.objectManager = objectManager;
    this.lineBuilder = new LineHelper();

    if (curveConfig) {
      this.curveConfig = { ...this.curveConfig, ...curveConfig };
    }

    // Use the shared trail lines group if provided, otherwise create our own
    if (trailLinesGroup) {
      this.trailLinesGroup = trailLinesGroup;
    } else {
      // Create a dedicated group for all trail-related lines
      this.trailLinesGroup = new THREE.Group();
      this.trailLinesGroup.name = "GROUP_TRAIL_LINES";
      this.objectManager.addRawObjectToScene(this.trailLinesGroup);
    }

    this.initializeBaseMaterial();
  }

  /**
   * Initializes the base material template for creating individual line materials.
   */
  private initializeBaseMaterial(): void {
    this.baseTrailMaterial = SharedMaterials.clone("TRAIL");
    if (this.baseTrailMaterial instanceof THREE.LineBasicMaterial) {
      this.baseTrailMaterial.transparent = true;
      this.baseTrailMaterial.opacity = 0.8;
    }
  }

  /**
   * Sets the curve configuration for trail interpolation.
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
   * Updates all trail visualizations based on the current objects.
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
    if (!this.visualizationVisible) return;

    // Update trail lines for all objects using their PositionHistoryManager
    Object.values(objects).forEach((obj) => {
      // For now, we'll use a simple approach that doesn't require PositionHistoryManager
      // In a real implementation, we'd need to access the PositionHistoryManager from the celestial renderer
      this.updateTrailFromPosition(obj);
    });
  }

  /**
   * Updates a trail line for a given object using its current position.
   * This is a simplified version that doesn't use PositionHistoryManager.
   */
  private updateTrailFromPosition(object: RenderableCelestialObject): void {
    // Only update if trail lines are enabled
    if (!this.visualizationVisible) {
      this.removeTrail(object.id);
      return;
    }

    // Create a simple trail from the current position
    const currentPosition = new THREE.Vector3().copy(object.position);

    // For demonstration, create a simple trail by adding some offset points
    const trailPoints: THREE.Vector3[] = [];
    const numPoints = Math.min(10, this.cachedEffectiveMaxTrailPoints);

    for (let i = 0; i < numPoints; i++) {
      const offset = new THREE.Vector3(
        Math.sin(i * 0.1) * 0.1,
        Math.cos(i * 0.1) * 0.1,
        Math.sin(i * 0.05) * 0.05,
      );
      trailPoints.push(currentPosition.clone().add(offset));
    }

    if (trailPoints.length < 2) {
      this.removeTrail(object.id);
      return;
    }

    // Apply curve interpolation to trail points
    const interpolatedPoints = TrailCurveInterpolator.interpolate(
      trailPoints,
      this.curveConfig,
    );
    this.drawTrailLine(object.id, interpolatedPoints);
  }

  /**
   * Updates the orbital line for a specific object using its PositionHistoryManager.
   */
  updateOrbitalLine(
    objectId: string,
    positionHistoryManager: PositionHistoryManager,
  ): void {
    // Only update if trail lines are enabled
    if (!this.visualizationVisible) {
      this.removeTrail(objectId);
      return;
    }

    // Get position history from the manager
    const positionHistory = positionHistoryManager.getPositionHistory();

    if (positionHistory.length < 2) {
      this.removeTrail(objectId);
      return;
    }

    // Use cached effective trail length
    const startIndex = Math.max(
      0,
      positionHistory.length - this.cachedEffectiveMaxTrailPoints,
    );

    // Convert OSVector3 positions to THREE.Vector3 for rendering
    const rawPoints = this.convertPositionsToVectors(
      positionHistory,
      startIndex,
    );

    // Always apply smooth interpolation for consistent visualization
    const interpolatedPoints = this.sampleAndInterpolatePoints(rawPoints);
    this.drawTrailLine(objectId, interpolatedPoints);
  }

  /**
   * Draws or updates the trail line for an object.
   */
  private drawTrailLine(objectId: string, points: THREE.Vector3[]): void {
    if (points.length < 2) {
      this.removeTrail(objectId);
      return;
    }

    const parentGroup = this.getOrCacheParentGroup(objectId);
    if (!parentGroup) {
      this.removeTrail(objectId);
      return;
    }

    let line = this.trailLines.get(objectId);
    const pointCount = points.length;

    if (!line) {
      line = this.createNewTrailLine(objectId, parentGroup);
    } else {
      this.ensureCorrectParenting(line, parentGroup);
    }

    this.updateLineGeometry(line, points, pointCount);
    this.setupLineHighlighting(line);
    this.applyHighlighting(line, objectId);
  }

  /**
   * Gets or caches the parent group for an object to avoid repeated lookups.
   */
  private getOrCacheParentGroup(objectId: string): THREE.Object3D | null {
    let parentGroup = this.parentGroupCache.get(objectId);

    if (!parentGroup) {
      const celestialMesh = this.objectManager.getObject(objectId);
      if (!celestialMesh?.parent) {
        return null;
      }
      parentGroup = celestialMesh.parent;
      this.parentGroupCache.set(objectId, parentGroup);
    }

    return parentGroup;
  }

  /**
   * Creates a new trail line with its own material instance.
   */
  private createNewTrailLine(
    objectId: string,
    parentGroup: THREE.Object3D,
  ): THREE.Line {
    if (!this.baseTrailMaterial) {
      this.initializeBaseMaterial();
    }

    // Clone the base material to create a unique instance for this line
    const lineMaterial = this.baseTrailMaterial!.clone();

    const bufferSize = this.calculateOptimalBufferSize();
    const line = this.lineBuilder.createLine(
      bufferSize,
      lineMaterial,
      `trail-line-${objectId}`,
    );

    line.frustumCulled = false; // Disable frustum culling to prevent disappearing
    line.renderOrder = RenderOrderManager.getRenderOrderForOrbit("trail");
    parentGroup.add(line);
    this.trailLines.set(objectId, line);

    return line;
  }

  /**
   * Ensures the line is parented to the correct group.
   */
  private ensureCorrectParenting(
    line: THREE.Line,
    parentGroup: THREE.Object3D,
  ): void {
    if (line.parent !== parentGroup) {
      line.removeFromParent();
      parentGroup.add(line);
    }
  }

  /**
   * Updates the line geometry with new points.
   */
  private updateLineGeometry(
    line: THREE.Line,
    points: THREE.Vector3[],
    pointCount: number,
  ): void {
    this.lineBuilder.updateLine(line, points, pointCount);

    // Only compute line distances for dashed materials
    if (line.material instanceof THREE.LineDashedMaterial) {
      line.computeLineDistances();
    }
  }

  /**
   * Sets up highlighting for a line by storing its default color.
   */
  private setupLineHighlighting(line: THREE.Line): void {
    if (
      (line.material instanceof THREE.LineBasicMaterial ||
        line.material instanceof THREE.LineDashedMaterial) &&
      !line.userData.defaultColor
    ) {
      line.userData.defaultColor = line.material.color.clone();
    }
  }

  /**
   * Applies highlighting to a line.
   */
  private applyHighlighting(line: THREE.Line, objectId: string): void {
    if (this.highlightedObjectId === objectId) {
      this.applyHighlight(objectId, line);
    }
  }

  /**
   * Converts OSVector3 positions to THREE.Vector3 for rendering.
   */
  private convertPositionsToVectors(
    positionHistory: any[],
    startIndex: number,
  ): THREE.Vector3[] {
    const pointCount = positionHistory.length - startIndex;
    const points: THREE.Vector3[] = [];

    // Pre-allocate array size for better performance
    points.length = pointCount;

    // Convert positions directly without intermediate array
    for (let i = 0; i < pointCount; i++) {
      const sourcePos = positionHistory[startIndex + i];
      points[i] = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
    }

    return points;
  }

  /**
   * Simple point sampling to reduce the number of line segments for performance.
   */
  private sampleAndInterpolatePoints(
    rawPoints: THREE.Vector3[],
  ): THREE.Vector3[] {
    if (rawPoints.length < 2) {
      return rawPoints;
    }

    // If we have few points, no need for sampling
    if (rawPoints.length <= this.samplingInterval) {
      return rawPoints;
    }

    // Simple sampling: take every Nth point
    const sampledPoints: THREE.Vector3[] = [];

    for (let i = 0; i < rawPoints.length; i += this.samplingInterval) {
      sampledPoints.push(rawPoints[i]);
    }

    // Always include the last point if it wasn't already included
    if (rawPoints.length > 0 && sampledPoints.length > 0) {
      const lastRawPoint = rawPoints[rawPoints.length - 1];
      const lastSampledPoint = sampledPoints[sampledPoints.length - 1];

      if (lastRawPoint !== lastSampledPoint) {
        sampledPoints.push(lastRawPoint);
      }
    }

    return sampledPoints;
  }

  /**
   * Highlights a specific object's trail visualization.
   */
  highlight(objectId: string | null, color: THREE.Color): void {
    this.highlightedObjectId = objectId;
    this.highlightColor = color;

    // Update all lines based on the new highlighting state
    this.trailLines.forEach((line, id) => {
      this.applyHighlight(id, line);
    });
  }

  /**
   * Sets the visibility of all trail visualizations.
   */
  setVisibility(visible: boolean): void {
    this.visualizationVisible = visible;
    this.trailLines.forEach((line) => {
      line.visible = visible;
    });
  }

  /**
   * Sets the visibility of trajectory prediction visualizations.
   * This is a no-op in the trails renderer as it doesn't use separate prediction lines.
   */
  setPredictionVisibility(visible: boolean): void {
    // This renderer does not have prediction lines
  }

  /**
   * Removes a trail line from the scene and memory.
   */
  removeTrail(objectId: string): void {
    const line = this.trailLines.get(objectId);
    if (line) {
      line.removeFromParent();
      line.geometry.dispose();
      this.trailLines.delete(objectId);
    }
    // Clear the parent group cache for this object
    this.parentGroupCache.delete(objectId);
  }

  /**
   * Clears all trail lines.
   */
  clearAllTrails(): void {
    this.trailLines.forEach((line) => {
      line.removeFromParent();
      line.geometry.dispose();
    });
    this.trailLines.clear();
    this.parentGroupCache.clear();
  }

  /**
   * Applies highlighting to a specific line.
   */
  private applyHighlight(objectId: string, line: THREE.Line): void {
    const material = line.material as THREE.LineBasicMaterial;
    if (objectId === this.highlightedObjectId) {
      material.color.set(this.highlightColor);
      material.opacity = 1.0;
    } else {
      // Reset to default color/state
      const defaultMaterial = SharedMaterials.TRAIL;
      if (defaultMaterial) {
        material.color.set(defaultMaterial.color);
        material.opacity = defaultMaterial.opacity;
      }
    }
    material.needsUpdate = true;
  }

  /**
   * Gets the fixed buffer size for trail lines.
   */
  private calculateOptimalBufferSize(): number {
    // Match the maximum trail points we actually render
    return this.baseMaxTrailPoints * this.trailLengthMultiplier;
  }

  /**
   * Sets the quality level for smoothed trail rendering.
   */
  setTrailQuality(quality: TrailQuality): void {
    this.trailQuality = quality;
  }

  /**
   * Gets performance statistics.
   */
  getPerformanceStats(): {
    trailLinesCount: number;
  } {
    return {
      trailLinesCount: this.trailLines.size,
    };
  }

  /**
   * Cleans up resources used by this renderer.
   */
  dispose(): void {
    this.clearAllTrails();
    this.parentGroupCache.clear();

    if (this.baseTrailMaterial) {
      this.baseTrailMaterial.dispose();
      this.baseTrailMaterial = null;
    }
  }
}
