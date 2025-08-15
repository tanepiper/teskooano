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

/**
 * Simple orbital renderer that draws lines between position history points.
 *
 * This renderer is designed to be lightweight and performant, focusing only
 * on rendering lines between the position points collected by the PositionHistoryManager.
 * It does not perform any calculations or data processing - it simply renders
 * the lines between the points provided by the manager.
 */
export class SimpleOrbitalRenderer {
  /** Map storing orbital lines, keyed by celestial object ID */
  private orbitalLines: Map<string, THREE.Line> = new Map();

  /** Cache for parent groups to avoid repeated lookups */
  private parentGroupCache: Map<string, THREE.Object3D> = new Map();

  /** Cached trail material to avoid repeated cloning */
  private cachedTrailMaterial: THREE.Material | null = null;

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

  /**
   * Creates a new SimpleOrbitalRenderer instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   */
  constructor(objectManager: ObjectManager) {
    this.objectManager = objectManager;
    this.lineBuilder = new LineHelper();
  }

  /**
   * Updates the orbital line for a specific object using its PositionHistoryManager.
   *
   * @param objectId - ID of the object to update
   * @param positionHistoryManager - The PositionHistoryManager for the object
   * @param cameraDistance - Distance from camera to object for LOD calculations
   */
  updateOrbitalLine(
    objectId: string,
    positionHistoryManager: PositionHistoryManager,
    cameraDistance: number,
  ): void {
    // Check if orbital lines should be visible based on LOD
    if (!this.shouldShowOrbitalLines(cameraDistance, positionHistoryManager)) {
      this.removeOrbitalLine(objectId);
      return;
    }

    // Get position history from the manager
    const positionHistory = positionHistoryManager.getPositionHistory();

    if (positionHistory.length < 2) {
      this.removeOrbitalLine(objectId);
      return;
    }

    // Convert OSVector3 positions to THREE.Vector3 for rendering
    const points = positionHistory.map(
      (pos) => new THREE.Vector3(pos.x, pos.y, pos.z),
    );

    this.drawOrbitalLine(objectId, points);
  }

  /**
   * Determines if orbital lines should be visible based on LOD and manager configuration.
   *
   * @param cameraDistance - Distance from camera to object
   * @param positionHistoryManager - The PositionHistoryManager for the object
   * @returns Whether orbital lines should be visible
   */
  private shouldShowOrbitalLines(
    cameraDistance: number,
    positionHistoryManager: PositionHistoryManager,
  ): boolean {
    // For now, always show orbital lines when visualization is enabled
    // TODO: Implement proper LOD distance checking
    return this.visualizationVisible;
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
    this.applyVisibilityAndHighlighting(line, objectId);
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
   * Creates a new orbital line with fixed buffer size.
   */
  private createNewOrbitalLine(
    objectId: string,
    parentGroup: THREE.Object3D,
  ): THREE.Line {
    const material = this.getOrCreateTrailMaterial();
    const bufferSize = this.calculateOptimalBufferSize();

    const line = this.lineBuilder.createLine(
      bufferSize,
      material,
      `orbital-line-${objectId}`,
    );

    line.frustumCulled = true;
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
   * Applies visibility and highlighting to a line.
   */
  private applyVisibilityAndHighlighting(
    line: THREE.Line,
    objectId: string,
  ): void {
    line.visible = this.visualizationVisible;

    if (this.highlightedObjectId === objectId) {
      this.applyHighlight(objectId, line);
    }
  }

  /**
   * Gets or creates the cached trail material.
   */
  private getOrCreateTrailMaterial(): THREE.Material {
    if (!this.cachedTrailMaterial) {
      this.cachedTrailMaterial = SharedMaterials.clone("TRAIL");
    }
    return this.cachedTrailMaterial;
  }

  /**
   * Gets the fixed buffer size for orbital lines.
   */
  private calculateOptimalBufferSize(): number {
    // Use a large fixed buffer size to avoid recreations
    // Most orbital trails won't exceed 1000 points, so this should be sufficient
    return 1000;
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
    this.cachedTrailMaterial = null;
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
