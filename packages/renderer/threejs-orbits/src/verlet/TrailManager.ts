import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineBuilder } from "../utils/LineBuilder";
import { OSVector3 } from "@teskooano/core-math";
import { CircularBuffer } from "../utils/CircularBuffer";
import { simplifyPath } from "../utils/simplify";
import { TrailQuality } from "@teskooano/renderer-threejs";

/**
 * Manages the creation and updating of trail lines showing an object's recent path.
 *
 * This manager offloads the storage and management of position history to a
 * Web Worker to keep the main render thread as light as possible.
 */
export class TrailManager {
  /** Map storing trail lines, keyed by celestial object ID */
  public trailLines: Map<string, THREE.Line> = new Map();

  /** Web worker for handling trail history. */
  private trailWorker: Worker | null = null;

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

  /** The quality setting for smoothed trails. */
  private trailQuality: TrailQuality = TrailQuality.High;

  /**
   * Creates a new TrailManager instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   */
  constructor(objectManager: ObjectManager) {
    this.objectManager = objectManager;
    this.lineBuilder = new LineBuilder();
    this.initializeWorker();
  }

  private initializeWorker(): void {
    this.trailWorker = new Worker(
      new URL("./trail.worker.ts", import.meta.url),
      { type: "module" },
    );

    this.trailWorker.onmessage = (
      e: MessageEvent<{
        objectId: string;
        points: [number, number, number][];
        maxHistoryLength: number;
      }>,
    ) => {
      const { objectId, points, maxHistoryLength } = e.data;
      const pointsTHREE = points.map(
        (p) => new THREE.Vector3(p[0], p[1], p[2]),
      );
      this.drawTrailLine(objectId, pointsTHREE, maxHistoryLength);
    };

    this.trailWorker.onerror = (e) => {
      console.error("Error from trail worker:", e);
    };
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
    if (!this.trailWorker) return;

    // Throttle updates by only sending data when updateGeometry is true
    if (updateGeometry) {
      this.trailWorker.postMessage({
        type: "update",
        objectId,
        position: object.position.toArray(),
        maxHistoryLength,
        quality: this.trailQuality,
      });
    }

    // Ensure the line is visible if it exists
    const line = this.trailLines.get(objectId);
    if (line) {
      line.visible = this.visualizationVisible;
      this.applyHighlight(objectId, line);
    }
  }

  private drawTrailLine(
    objectId: string,
    points: THREE.Vector3[],
    maxHistoryLength: number,
  ): void {
    let line = this.trailLines.get(objectId);
    const requiredBufferSize = Math.max(1, maxHistoryLength);
    let isNewLine = false;

    if (!line) {
      isNewLine = true;
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
      this.lineBuilder.resizeLineBuffer(line, requiredBufferSize);
    }

    // Only update geometry if there are points to draw
    if (points.length > 0) {
      this._updateLineGeometryFromVectors(line, points);
    }

    line.visible = this.visualizationVisible;
    this.trailLines.forEach((_, id) => {
      this.applyHighlight(id, line);
    });
  }

  private _updateLineGeometryFromVectors(
    line: THREE.Line,
    points: THREE.Vector3[],
  ): void {
    const geometry = line.geometry;
    const positionAttribute = geometry.attributes
      .position as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;

    const numPointsToDraw = Math.min(points.length, positionAttribute.count);

    for (let i = 0; i < numPointsToDraw; i++) {
      const point = points[i];
      const offset = i * 3;
      positions[offset] = point.x;
      positions[offset + 1] = point.y;
      positions[offset + 2] = point.z;
    }

    // If there are fewer points than the buffer capacity, fill the rest with the last point
    if (numPointsToDraw > 0 && numPointsToDraw < positionAttribute.count) {
      const lastPoint = points[numPointsToDraw - 1];
      for (let i = numPointsToDraw; i < positionAttribute.count; i++) {
        const offset = i * 3;
        positions[offset] = lastPoint.x;
        positions[offset + 1] = lastPoint.y;
        positions[offset + 2] = lastPoint.z;
      }
    }

    positionAttribute.needsUpdate = true;
    geometry.setDrawRange(0, numPointsToDraw);
  }

  /**
   * Removes a trail line from the scene and memory.
   * @param objectId - ID of the object whose trail should be removed
   */
  removeTrail(objectId: string): void {
    const line = this.trailLines.get(objectId);
    if (line) {
      this.objectManager.removeRawObjectFromScene(line);
      this.lineBuilder.disposeLine(line);
      this.trailLines.delete(objectId);
    }
    this.trailWorker?.postMessage({ type: "remove", objectId });
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
    this.trailWorker?.postMessage({ type: "clear-all" });
    this.trailWorker?.terminate();
    this.trailLines.forEach((line, objectId) => {
      this.removeTrail(objectId);
    });
    this.trailLines.clear();
  }

  /**
   * Adjusts the history buffer for all trails to a new maximum length.
   * This is useful for dynamically changing trail length settings.
   * @param maxHistoryLength The new maximum length for the history buffer.
   */
  limitHistoryMemory(maxHistoryLength: number): void {
    this.trailWorker?.postMessage({
      type: "set-history-limit",
      maxHistoryLength,
    });
  }

  /**
   * Sets the quality level for smoothed trail rendering.
   * @param quality The desired trail quality level.
   */
  setTrailQuality(quality: TrailQuality): void {
    this.trailQuality = quality;
  }
}
