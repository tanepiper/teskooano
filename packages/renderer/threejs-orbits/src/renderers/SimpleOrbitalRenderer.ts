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

    // Get the celestial object's main mesh to find its parent group
    const celestialMesh = this.objectManager.getObject(objectId);
    if (!celestialMesh || !celestialMesh.parent) {
      // If the object or its group doesn't exist, we can't attach the line.
      this.removeOrbitalLine(objectId);
      return;
    }
    const parentGroup = celestialMesh.parent;

    let line = this.orbitalLines.get(objectId);
    const pointCount = points.length;

    if (!line) {
      const material = SharedMaterials.clone("TRAIL");
      // Create line with a larger buffer to accommodate growing position history
      const bufferSize = Math.max(pointCount * 2, 100); // At least 100 points or double current
      line = this.lineBuilder.createLine(
        bufferSize,
        material,
        `orbital-line-${objectId}`,
      );
      line.frustumCulled = false;

      // Apply correct render order for trails
      line.renderOrder = RenderOrderManager.getRenderOrderForOrbit("trail");

      // Add orbital line to the celestial's own group
      parentGroup.add(line);
      this.orbitalLines.set(objectId, line);
    } else {
      // Ensure the line is parented to the correct group, in case it has changed.
      if (line.parent !== parentGroup) {
        line.removeFromParent();
        parentGroup.add(line);
      }
      // Check if we need to resize the line buffer due to circular buffer wrapping
      const currentBufferSize = line.geometry.attributes.position.count;
      if (pointCount > currentBufferSize) {
        // Need to recreate the line with a larger buffer
        this.removeOrbitalLine(objectId);
        const material = SharedMaterials.clone("TRAIL");
        const bufferSize = Math.max(pointCount * 2, 100);
        line = this.lineBuilder.createLine(
          bufferSize,
          material,
          `orbital-line-${objectId}`,
        );
        line.frustumCulled = false;
        parentGroup.add(line);
        this.orbitalLines.set(objectId, line);
      }
    }

    this.lineBuilder.updateLine(line, points, pointCount);
    line.computeLineDistances();

    // Store default color for highlighting
    if (
      (line.material instanceof THREE.LineBasicMaterial ||
        line.material instanceof THREE.LineDashedMaterial) &&
      !line.userData.defaultColor
    ) {
      line.userData.defaultColor = line.material.color.clone();
    }

    line.visible = this.visualizationVisible;

    // Apply highlighting if this object is highlighted
    if (this.highlightedObjectId === objectId) {
      this.applyHighlight(objectId, line);
    }
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
  }

  /**
   * Disposes of resources used by this renderer.
   */
  dispose(): void {
    this.clearAllOrbitalLines();
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
