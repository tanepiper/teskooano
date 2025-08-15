import {
  simulationState$,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import { PositionHistoryManager } from "@teskooano/renderer-threejs-celestial";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";
import { type ObjectManager } from "@teskooano/renderer-threejs-objects";
import * as THREE from "three";
import { SharedMaterials } from "../core/SharedMaterials";

/**
 * Simple orbital renderer that draws lines between position history points.
 *
 * This renderer is designed to be lightweight and performant, focusing only
 * on rendering lines between the position points collected by the PositionHistoryManager.
 * It uses individual THREE.Line objects with shared materials for optimal performance.
 */
export class SimpleOrbitalRenderer extends StateSubscriptionMixin {
  /** Map storing orbital lines, keyed by celestial object ID */
  private orbitalLines: Map<string, THREE.Line> = new Map();

  /** Cache for parent groups to avoid repeated lookups */
  private parentGroupCache: Map<string, THREE.Object3D> = new Map();

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineHelper;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** Flag indicating if orbital visualization is enabled */
  private visualizationVisible: boolean = true;

  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;

  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);

  /** Maximum number of points to render in orbital trails */
  private readonly baseMaxTrailPoints: number = 1000;

  /** Current trail length multiplier from settings */
  private trailLengthMultiplier: number = 2; // Default 2x multiplier

  /** Cached effective max trail points to avoid recalculation */
  private cachedEffectiveMaxTrailPoints: number = 2000; // 1000 * 2

  /** Number of points to skip when sampling for interpolation */
  private readonly samplingInterval: number = 2;

  /** Current simulation state to check if paused */
  private currentSimulationState: any = null;

  /** Base material template for creating individual line materials */
  private baseTrailMaterial: THREE.Material | null = null;

  /**
   * Creates a new SimpleOrbitalRenderer instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   */
  constructor(objectManager: ObjectManager) {
    super();
    this.objectManager = objectManager;
    this.lineBuilder = new LineHelper();
    this.subscribeToState(simulationState$, this.handleStateChange);
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
   * Updates the orbital line for a specific object using its PositionHistoryManager.
   *
   * @param objectId - ID of the object to update
   * @param positionHistoryManager - The PositionHistoryManager for the object
   */
  updateOrbitalLine(
    objectId: string,
    positionHistoryManager: PositionHistoryManager,
  ): void {
    // Only update if orbital lines are enabled
    if (!this.visualizationVisible) {
      this.removeOrbitalLine(objectId);
      return;
    }

    // Check if simulation is paused - don't update orbital lines when paused
    const simulationState = this.getCurrentSimulationState();
    if (simulationState?.isPaused) {
      return;
    }

    // Get position history from the manager
    const positionHistory = positionHistoryManager.getPositionHistory();

    if (positionHistory.length < 2) {
      this.removeOrbitalLine(objectId);
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

    // Only sample and interpolate if simulation is not paused
    if (!this.currentSimulationState?.paused) {
      // Sample and interpolate points for smooth curves
      const interpolatedPoints = this.sampleAndInterpolatePoints(rawPoints);
      this.drawOrbitalLine(objectId, interpolatedPoints);
    } else {
      // When paused, just draw the raw points without interpolation
      this.drawOrbitalLine(objectId, rawPoints);
    }
  }

  /**
   * Draws or updates the orbital line for an object.
   *
   * @param objectId - ID of the object
   * @param points - Array of THREE.Vector3 points to connect
   */
  private drawOrbitalLine(objectId: string, points: THREE.Vector3[]): void {
    if (points.length < 2) {
      this.removeOrbitalLine(objectId);
      return;
    }

    const parentGroup = this.getOrCacheParentGroup(objectId);
    if (!parentGroup) {
      this.removeOrbitalLine(objectId);
      return;
    }

    let line = this.orbitalLines.get(objectId);
    const pointCount = points.length;

    if (!line) {
      line = this.createNewOrbitalLine(objectId, parentGroup);
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
   * Creates a new orbital line with its own material instance.
   */
  private createNewOrbitalLine(
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
      `orbital-line-${objectId}`,
    );

    line.frustumCulled = false; // Disable frustum culling to prevent disappearing
    line.renderOrder = RenderOrderManager.getRenderOrderForOrbit("trail");
    parentGroup.add(line);
    this.orbitalLines.set(objectId, line);

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
   * Optimized to avoid unnecessary array slicing.
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
   * Samples points at regular intervals and interpolates between them for smooth curves.
   * This reduces the number of line segments while maintaining visual quality.
   *
   * @param rawPoints - Array of all position points
   * @returns Array of interpolated points for smooth rendering
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

    const interpolatedPoints: THREE.Vector3[] = [];

    // Sample points at regular intervals
    for (let i = 0; i < rawPoints.length; i += this.samplingInterval) {
      interpolatedPoints.push(rawPoints[i].clone());

      // If this isn't the last sampled point, interpolate to the next one
      if (i + this.samplingInterval < rawPoints.length) {
        const nextIndex = Math.min(
          i + this.samplingInterval,
          rawPoints.length - 1,
        );
        const currentPoint = rawPoints[i];
        const nextPoint = rawPoints[nextIndex];

        // Add interpolated points between current and next sampled point
        for (
          let j = 1;
          j < this.samplingInterval && i + j < rawPoints.length;
          j++
        ) {
          const t = j / this.samplingInterval;
          const interpolatedPoint = new THREE.Vector3().lerpVectors(
            currentPoint,
            nextPoint,
            t,
          );
          interpolatedPoints.push(interpolatedPoint);
        }
      }
    }

    // Always include the last point if it wasn't already included
    if (rawPoints.length > 0 && interpolatedPoints.length > 0) {
      const lastRawPoint = rawPoints[rawPoints.length - 1];
      const lastInterpolatedPoint =
        interpolatedPoints[interpolatedPoints.length - 1];

      if (lastRawPoint.distanceTo(lastInterpolatedPoint) > 0.001) {
        interpolatedPoints.push(lastRawPoint.clone());
      }
    }

    return interpolatedPoints;
  }

  /**
   * Removes the orbital line for a specific object.
   *
   * @param objectId - ID of the object to remove orbital line for
   */
  removeOrbitalLine(objectId: string): void {
    const line = this.orbitalLines.get(objectId);
    if (line) {
      line.removeFromParent();
      line.geometry.dispose();
      this.orbitalLines.delete(objectId);
    }
    // Clear the parent group cache for this object
    this.parentGroupCache.delete(objectId);
  }

  /**
   * Sets the visibility of all orbital lines.
   *
   * @param visible - Whether orbital lines should be visible
   */
  setVisibility(visible: boolean): void {
    this.visualizationVisible = visible;

    this.orbitalLines.forEach((line) => {
      line.visible = visible;
    });
  }

  /**
   * Sets the highlighted object.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlighting
   * @param highlightColor - Optional color for highlighting
   */
  setHighlightedObject(
    objectId: string | null,
    highlightColor?: THREE.Color,
  ): void {
    this.highlightedObjectId = objectId;

    if (highlightColor) {
      this.highlightColor = highlightColor;
    }

    // Clear previous highlighting
    this.orbitalLines.forEach((line) => {
      if (
        line.userData.defaultColor &&
        line.material instanceof THREE.LineBasicMaterial
      ) {
        line.material.color.copy(line.userData.defaultColor);
      } else if (
        line.userData.defaultColor &&
        line.material instanceof THREE.LineDashedMaterial
      ) {
        line.material.color.copy(line.userData.defaultColor);
      }
    });

    // Apply new highlighting
    if (objectId) {
      const line = this.orbitalLines.get(objectId);
      if (line) {
        this.applyHighlight(objectId, line);
      }
    }
  }

  /**
   * Applies highlighting to a specific line.
   *
   * @param objectId - ID of the object being highlighted
   * @param line - The line to highlight
   */
  private applyHighlight(objectId: string, line: THREE.Line): void {
    if (line.material instanceof THREE.LineBasicMaterial) {
      line.material.color.copy(this.highlightColor);
    } else if (line.material instanceof THREE.LineDashedMaterial) {
      line.material.color.copy(this.highlightColor);
    }
  }

  /**
   * Gets the current simulation state to check if simulation is paused.
   */
  private getCurrentSimulationState(): any {
    return this.currentSimulationState;
  }

  /**
   * Handles simulation state changes to update trail length multiplier.
   */
  private handleStateChange = (state: any): void => {
    // Store current simulation state for pause checking
    this.currentSimulationState = state;

    const newMultiplier = state.visualSettings?.trailLengthMultiplier;
    if (
      newMultiplier !== undefined &&
      newMultiplier !== this.trailLengthMultiplier
    ) {
      this.trailLengthMultiplier = newMultiplier;
      this.cachedEffectiveMaxTrailPoints =
        this.baseMaxTrailPoints * this.trailLengthMultiplier;
    }
  };

  /**
   * Gets the fixed buffer size for orbital lines.
   */
  private calculateOptimalBufferSize(): number {
    // Match the maximum trail points we actually render
    return this.baseMaxTrailPoints * this.trailLengthMultiplier;
  }

  /**
   * Clears all orbital lines.
   */
  clearAllOrbitalLines(): void {
    this.orbitalLines.forEach((line) => {
      line.removeFromParent();
      line.geometry.dispose();
    });
    this.orbitalLines.clear();
    this.parentGroupCache.clear();
  }

  /**
   * Disposes of resources used by this renderer.
   */
  dispose(): void {
    this.clearAllOrbitalLines();
    this.parentGroupCache.clear();

    if (this.baseTrailMaterial) {
      this.baseTrailMaterial.dispose();
      this.baseTrailMaterial = null;
    }
  }

  /**
   * Gets performance statistics.
   *
   * @returns Performance statistics
   */
  getPerformanceStats(): {
    orbitalLinesCount: number;
  } {
    return {
      orbitalLinesCount: this.orbitalLines.size,
    };
  }
}
