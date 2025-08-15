import * as THREE from "three";
import {
  type RenderableCelestialObject,
  CelestialType,
} from "@teskooano/data-types";
import { type ObjectManager } from "@teskooano/renderer-threejs-objects";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import { SharedMaterials } from "../core/SharedMaterials";
import { PositionHistoryManager } from "@teskooano/renderer-threejs-celestial";
import {
  simulationState$,
  StateSubscriptionMixin,
} from "@teskooano/core-state";

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
    const points = this.convertPositionsToVectors(positionHistory, startIndex);

    this.drawOrbitalLine(objectId, points);
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
   * Handles simulation state changes to update trail length multiplier.
   */
  private handleStateChange = (state: any): void => {
    const newMultiplier = state.visualSettings?.trailLengthMultiplier;
    if (
      newMultiplier !== undefined &&
      newMultiplier !== this.trailLengthMultiplier
    ) {
      this.trailLengthMultiplier = newMultiplier;
      this.cachedEffectiveMaxTrailPoints =
        this.baseMaxTrailPoints * this.trailLengthMultiplier;
      console.debug(
        `[SimpleOrbitalRenderer] Trail multiplier updated to: ${newMultiplier}x (${this.cachedEffectiveMaxTrailPoints} points)`,
      );
    }
  };

  /**
   * Sets the maximum number of points to render in orbital trails.
   *
   * @param maxPoints - Maximum number of points (default: 2000 with 2x multiplier)
   * @deprecated Use trail length multiplier in settings instead
   */
  setMaxTrailPoints(maxPoints: number): void {
    if (maxPoints < 2) {
      console.warn(
        "[SimpleOrbitalRenderer] Max trail points must be at least 2",
      );
      return;
    }

    // Calculate what multiplier this would be
    const multiplier = maxPoints / this.baseMaxTrailPoints;
    console.warn(
      `[SimpleOrbitalRenderer] setMaxTrailPoints is deprecated. Use trail length multiplier (${multiplier.toFixed(1)}x) in settings instead.`,
    );
  }

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
