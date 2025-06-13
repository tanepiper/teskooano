import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineBuilder } from "../utils/LineBuilder";
import { CircularBuffer } from "../utils/CircularBuffer";

/**
 * Manages the creation and updating of trail lines showing an object's recent path.
 *
 * Trail lines display the recent historical positions of celestial objects to
 * visualize their movement trajectory over time.
 */
export class TrailManager {
  /** Map storing trail lines, keyed by celestial object ID */
  public trailLines: Map<string, THREE.Line> = new Map();

  /** Position history for each object */
  private positionHistory: Map<string, CircularBuffer<THREE.Vector3>> =
    new Map();

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineBuilder;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** Current highlighting state */
  private highlightedObjectId: string | null = null;

  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0xffff00);

  /** Flag indicating if trail visualization is enabled */
  private visualizationVisible: boolean = true;

  /**
   * Creates a new TrailManager instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   */
  constructor(objectManager: ObjectManager) {
    this.objectManager = objectManager;
    this.lineBuilder = new LineBuilder();
  }

  /**
   * Updates a trail line for a given object, adding its current position to the history.
   *
   * @param objectId - ID of the object to update
   * @param object - The renderable object data
   * @param maxHistoryLength - Maximum number of positions to keep in history
   * @param updateGeometry - Whether to push the geometry update to the GPU
   */
  updateTrail(
    objectId: string,
    object: RenderableCelestialObject,
    maxHistoryLength: number,
    updateGeometry: boolean,
  ): void {
    // Get or initialize position history for this object
    let history = this.positionHistory.get(objectId);
    if (!history) {
      history = new CircularBuffer<THREE.Vector3>(maxHistoryLength);
      this.positionHistory.set(objectId, history);
    }

    // Ensure the buffer has the correct capacity
    if (history.capacity !== maxHistoryLength) {
      history.resize(maxHistoryLength);
    }

    // Add current position to history
    history.push(object.position.clone());

    let line = this.trailLines.get(objectId);
    const requiredBufferSize = Math.max(1, maxHistoryLength);

    if (!line) {
      const material = SharedMaterials.clone("TRAIL");
      line = this.lineBuilder.createLine(
        requiredBufferSize,
        material,
        `trail-line-${objectId}`,
      );

      line.frustumCulled = false;
      this.objectManager.addRawObjectToScene(line);
      this.trailLines.set(objectId, line);
    } else {
      // Ensure buffer capacity is sufficient
      this.lineBuilder.resizeLineBuffer(line, requiredBufferSize);
    }

    // Update the line with current history points
    if (updateGeometry || !line.visible) {
      const pointsToDraw = history.getOrderedItems();
      this.lineBuilder.updateLine(line, pointsToDraw, pointsToDraw.length);
    }

    // Update visibility
    line.visible = this.visualizationVisible;

    // Apply highlighting if needed
    this.applyHighlight(objectId, line);
  }

  /**
   * Removes a trail line from the scene and memory.
   * @param objectId - ID of the object whose trail should be removed
   */
  removeTrail(objectId: string): void {
    const line = this.trailLines.get(objectId);
    if (line) {
      this.objectManager.removeObjectFromScene(line);
      this.lineBuilder.disposeLine(line);
      this.trailLines.delete(objectId);
    }
    this.positionHistory.delete(objectId);
  }

  /**
   * Sets the visibility of all trail lines.
   * @param visible - `true` to show trails, `false` to hide them
   */
  setVisibility(visible: boolean): void {
    this.visualizationVisible = visible;
    this.trailLines.forEach((line) => {
      line.visible = visible;
    });
  }

  /**
   * Highlights the trail of a specific object and unhighlights others.
   *
   * @param objectId - The ID of the object to highlight, or `null` to clear highlighting.
   * @param highlightColor - The color to use for highlighting.
   */
  setHighlightedObject(
    objectId: string | null,
    highlightColor?: THREE.Color,
  ): void {
    this.highlightedObjectId = objectId;
    if (highlightColor) {
      this.highlightColor = highlightColor;
    }

    // Update all lines based on the new highlighting state
    this.trailLines.forEach((line, id) => {
      this.applyHighlight(id, line);
    });
  }

  /**
   * Applies or removes the highlight from a single line based on the current state.
   * @param objectId - The ID of the object associated with the line.
   * @param line - The THREE.Line object to modify.
   */
  private applyHighlight(objectId: string, line: THREE.Line): void {
    const material = line.material as THREE.LineBasicMaterial;
    if (objectId === this.highlightedObjectId) {
      material.color.set(this.highlightColor);
      material.opacity = 1.0;
    } else {
      // Assuming a default color/state is desired for non-highlighted trails
      const defaultMaterial = SharedMaterials.TRAIL;
      if (defaultMaterial) {
        material.color.set(defaultMaterial.color);
        material.opacity = defaultMaterial.opacity;
      }
    }
    material.needsUpdate = true;
  }

  /**
   * Disposes of all resources used by the TrailManager.
   */
  dispose(): void {
    this.trailLines.forEach((line, objectId) => {
      this.removeTrail(objectId);
    });
    this.trailLines.clear();
    this.positionHistory.clear();
  }

  /**
   * Adjusts the history buffer for all trails to a new maximum length.
   * This is useful for dynamically changing trail length settings.
   * @param maxHistoryLength The new maximum length for the history buffer.
   */
  limitHistoryMemory(maxHistoryLength: number): void {
    this.positionHistory.forEach((buffer) => {
      buffer.resize(maxHistoryLength);
    });
  }
}
