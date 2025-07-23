import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineBuilder } from "../utils/LineBuilder";
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

  /** Sampling state for orbital-aware trail collection */
  private lastSampledPositions: Map<string, THREE.Vector3> = new Map();
  private lastSampledTimes: Map<string, number> = new Map();

  /** Minimum distance to move before sampling (in scene units) - prevents micro-wobbles */
  private readonly MIN_SAMPLE_DISTANCE_SQ = 1e-6;

  /** Batch processing for worker communication */
  private pendingUpdates: Array<{
    objectId: string;
    position: [number, number, number];
    maxHistoryLength: number;
    quality: string;
  }> = [];
  private lastBatchTime: number = 0;
  private readonly BATCH_INTERVAL = 100; // Process batches every 100ms
  private readonly MAX_BATCH_SIZE = 20; // Maximum updates per batch

  /** Performance monitoring */
  private messageCount: number = 0;
  private lastPerformanceCheck: number = 0;
  private readonly PERFORMANCE_CHECK_INTERVAL = 5000; // Check every 5 seconds

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
        type: "batch-results";
        results: Array<{
          objectId: string;
          points: [number, number, number][];
          maxHistoryLength: number;
        }>;
      }>,
    ) => {
      const { results } = e.data;

      // Process all results from the batch
      for (const result of results) {
        const { objectId, points, maxHistoryLength } = result;
        const pointsTHREE = points.map(
          (p) => new THREE.Vector3(p[0], p[1], p[2]),
        );
        this.drawTrailLine(objectId, pointsTHREE, maxHistoryLength);
      }
    };

    this.trailWorker.onerror = (e) => {
      console.error("Error from trail worker:", e);
    };
  }

  /**
   * Updates a trail line for a given object, adding its current position to the history.
   *
   * Uses orbital-aware sampling to capture general trajectory rather than every micro-wobble.
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

    // Implement orbital-aware sampling
    const currentTime = Date.now();
    const currentPosition = new THREE.Vector3().copy(object.position);

    const lastSampledPosition = this.lastSampledPositions.get(objectId);
    const lastSampledTime = this.lastSampledTimes.get(objectId) || 0;

    let shouldSample = false;

    if (!lastSampledPosition) {
      // First sample for this object
      shouldSample = true;
    } else {
      const timeSinceLastSample = currentTime - lastSampledTime;

      // Dynamically adjust sample interval based on velocity.
      // Faster objects need more frequent sampling.
      const velocity = object.velocityMagnitude_mps || 1; // m/s, avoid 0
      // An object at 50km/s (50000 m/s) should be sampled frequently (~100ms interval).
      // An object at 1km/s (1000 m/s) can be sampled less often (~2s interval).
      // Using an inverse relationship: interval = C / velocity.
      // For 50km/s: 100 = C / 50000 -> C = 5,000,000
      const C = 5_000_000;
      let dynamicInterval = C / velocity;
      dynamicInterval = Math.max(100, Math.min(2000, dynamicInterval)); // Clamp between 100ms and 2s.

      const distanceSqSinceLastSample =
        currentPosition.distanceToSquared(lastSampledPosition);

      // Sample if enough time has passed AND the object has moved significantly.
      // The dynamic interval provides more points for high-velocity objects.
      if (
        timeSinceLastSample >= dynamicInterval &&
        distanceSqSinceLastSample >= this.MIN_SAMPLE_DISTANCE_SQ
      ) {
        shouldSample = true;
      }
    }

    if (shouldSample && updateGeometry) {
      this.lastSampledPositions.set(objectId, currentPosition.clone());
      this.lastSampledTimes.set(objectId, currentTime);

      // Add to pending batch instead of sending immediately
      this.pendingUpdates.push({
        objectId,
        position: object.position.toArray(),
        maxHistoryLength,
        quality: this.trailQuality,
      });

      // Send batch if we have enough updates or enough time has passed
      if (
        this.pendingUpdates.length >= this.MAX_BATCH_SIZE ||
        currentTime - this.lastBatchTime >= this.BATCH_INTERVAL
      ) {
        this.sendBatch();
      }
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

    // Clear the rest of the buffer to prevent visual artifacts from old data
    if (numPointsToDraw < positionAttribute.count) {
      for (let i = numPointsToDraw; i < positionAttribute.count; i++) {
        const offset = i * 3;
        positions[offset] = 0;
        positions[offset + 1] = 0;
        positions[offset + 2] = 0;
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

    // Clean up sampling state
    this.lastSampledPositions.delete(objectId);
    this.lastSampledTimes.delete(objectId);

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
    // Flush any pending updates before terminating
    this.sendBatch();

    this.trailWorker?.postMessage({ type: "clear-all" });
    this.trailWorker?.terminate();
    this.trailLines.forEach((line, objectId) => {
      this.removeTrail(objectId);
    });
    this.trailLines.clear();

    // Clean up all sampling state
    this.lastSampledPositions.clear();
    this.lastSampledTimes.clear();
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

  /**
   * Sets the maximum number of points to send from the worker for trail rendering.
   * Lower values improve performance but reduce trail detail.
   * @param maxPoints The maximum number of points (default: 500)
   */
  setMaxTrailPoints(maxPoints: number): void {
    this.trailWorker?.postMessage({
      type: "set-max-points",
      maxPoints: Math.max(100, Math.min(2000, maxPoints)), // Clamp between 100 and 2000
    });
  }

  /**
   * Gets performance statistics for monitoring.
   * @returns Performance statistics object
   */
  getPerformanceStats(): {
    trailLinesCount: number;
    pendingUpdatesCount: number;
    messageCount: number;
  } {
    return {
      trailLinesCount: this.trailLines.size,
      pendingUpdatesCount: this.pendingUpdates.length,
      messageCount: this.messageCount,
    };
  }

  private sendBatch(): void {
    if (this.pendingUpdates.length === 0) return;

    const batch = this.pendingUpdates;
    this.pendingUpdates = [];
    this.lastBatchTime = Date.now();

    this.trailWorker?.postMessage({
      type: "update-batch",
      updates: batch,
    });

    // Performance monitoring
    this.messageCount++;
    const currentTime = Date.now();
    if (
      currentTime - this.lastPerformanceCheck >=
      this.PERFORMANCE_CHECK_INTERVAL
    ) {
      const messagesPerSecond =
        (this.messageCount * 1000) / this.PERFORMANCE_CHECK_INTERVAL;
      if (messagesPerSecond > 10) {
        // Log if more than 10 messages per second
        console.warn(
          `[TrailManager] High message frequency: ${messagesPerSecond.toFixed(1)} messages/sec`,
        );
      }
      this.messageCount = 0;
      this.lastPerformanceCheck = currentTime;
    }
  }
}
