import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineBuilder } from "../utils/LineBuilder";

/**
 * Configuration options for trail rendering
 */
export interface TrailOptions {
  /** Whether to apply smoothing to the trail lines */
  smoothLines?: boolean;
  /** Number of subdivisions to create between points when smoothing is enabled */
  smoothingSubdivisions?: number;
}

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
  private positionHistory: Map<string, THREE.Vector3[]> = new Map();

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

  /** Options for trail rendering */
  private options: TrailOptions = {
    smoothLines: true,
    smoothingSubdivisions: 20,
  };

  /**
   * Creates a new TrailManager instance.
   *
   * @param objectManager - The scene's ObjectManager for adding/removing objects
   * @param options - Optional configuration for trail rendering
   */
  constructor(objectManager: ObjectManager, options?: TrailOptions) {
    this.objectManager = objectManager;
    this.lineBuilder = new LineBuilder();

    if (options) {
      this.options = { ...this.options, ...options };
    }
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
      history = [];
      this.positionHistory.set(objectId, history);
    }

    // Add current position to history
    history.push(object.position.clone());

    // Trim history if it exceeds maximum length
    if (history.length > maxHistoryLength) {
      history.shift();
    }

    let line = this.trailLines.get(objectId);
    let requiredBufferSize: number;

    if (this.options.smoothLines && maxHistoryLength >= 3) {
      // Calculate buffer size needed for smoothed points
      // Ensure at least 1 segment for smoothing, hence Math.max(1, maxHistoryLength -1)
      requiredBufferSize =
        Math.max(1, maxHistoryLength - 1) *
        (this.options.smoothingSubdivisions || 6);
      // If history is shorter than 3, actual smoothed points will be less, but buffer is for max potential
    } else {
      // Buffer size for raw points or if history too short for full smoothing effect
      requiredBufferSize = maxHistoryLength;
    }
    // Ensure buffer is at least 1, even if maxHistoryLength is 0 or 1 (and no smoothing)
    requiredBufferSize = Math.max(1, requiredBufferSize);

    if (!line) {
      const material = SharedMaterials.clone("TRAIL");
      line = this.lineBuilder.createLine(
        requiredBufferSize, // Use calculated bufferSize for creation
        material,
        `trail-line-${objectId}`,
      );

      line.frustumCulled = false;
      this.objectManager.addRawObjectToScene(line);
      this.trailLines.set(objectId, line);
    } else {
      // Ensure buffer capacity is sufficient
      this.lineBuilder.resizeLineBuffer(line, requiredBufferSize); // Resize with new requiredBufferSize
    }

    // Update the line with current history points
    if (updateGeometry || !line.visible) {
      let pointsToDraw: THREE.Vector3[];
      // Use smoothing if enabled AND history is long enough for CatmullRom curve (at least 3 points)
      if (this.options.smoothLines && history.length >= 3) {
        pointsToDraw = this.generateSmoothedPoints(history);
      } else {
        pointsToDraw = history; // Use raw history if not smoothing or history too short
      }
      // The third argument to lineBuilder.updateLine (maxPoints) is used by LineBuilder
      // to determine if the buffer needs to be re-filled past the current draw range.
      // We pass pointsToDraw.length as LineBuilder will use this for setDrawRange.
      this.lineBuilder.updateLine(line, pointsToDraw, pointsToDraw.length);
    }

    // Update visibility
    line.visible = this.visualizationVisible;

    // Apply highlighting if needed
    this.applyHighlight(objectId, line);
  }

  /**
   * Generates smoothed points from position history using Catmull-Rom spline interpolation.
   *
   * @param points - The original position points
   * @returns An array of interpolated points forming a smooth curve
   * @private
   */
  private generateSmoothedPoints(points: THREE.Vector3[]): THREE.Vector3[] {
    if (points.length < 3) return [...points];

    // Create a Catmull-Rom spline through the points
    const curve = new THREE.CatmullRomCurve3(
      points,
      false, // Not a closed loop
      "centripetal", // Curve type: good for preventing self-intersections/cusps
      0.5, // Tension: 0.5 is default for centripetal
    );

    // Determine number of points in the final curve based on original segments and subdivisions
    // More subdivisions = smoother curve between original history points
    const segments =
      Math.max(1, points.length - 1) *
      (this.options.smoothingSubdivisions || 6);

    // Generate points along the curve using the original parameterization
    return curve.getPoints(segments);
  }

  /**
   * Sets the options for trail rendering.
   *
   * @param options - New options to apply
   */
  setOptions(options: TrailOptions): void {
    this.options = { ...this.options, ...options };

    // Update all existing trails if needed
    if (this.visualizationVisible) {
      this.trailLines.forEach((line, objectId) => {
        const history = this.positionHistory.get(objectId);
        if (history && history.length > 0) {
          if (this.options.smoothLines && history.length > 2) {
            const smoothedPoints = this.generateSmoothedPoints(history);
            this.lineBuilder.updateLine(
              line,
              smoothedPoints,
              smoothedPoints.length,
            );
          } else {
            this.lineBuilder.updateLine(line, history, history.length);
          }
        }
      });
    }
  }

  /**
   * Removes a specific trail line from the scene.
   *
   * @param objectId - ID of the object whose trail should be removed
   */
  removeTrail(objectId: string): void {
    const line = this.trailLines.get(objectId);
    if (line) {
      this.objectManager.removeRawObjectFromScene(line);
      this.lineBuilder.disposeLine(line);
      this.trailLines.delete(objectId);
      this.positionHistory.delete(objectId);
    }
  }

  /**
   * Sets the visibility state for all trail lines.
   *
   * @param visible - Whether trails should be visible
   */
  setVisibility(visible: boolean): void {
    if (this.visualizationVisible === visible) return;

    this.visualizationVisible = visible;
    this.trailLines.forEach((line) => {
      line.visible = visible;
    });
  }

  /**
   * Sets the highlighted object ID and applies highlighting.
   *
   * @param objectId - ID of the object to highlight, or null to clear highlighting
   * @param highlightColor - Color to use for highlighting
   */
  setHighlightedObject(
    objectId: string | null,
    highlightColor?: THREE.Color,
  ): void {
    const previousHighlightId = this.highlightedObjectId;
    this.highlightedObjectId = objectId;

    if (highlightColor) {
      this.highlightColor = highlightColor;
    }

    // Reset previous highlight
    if (previousHighlightId && previousHighlightId !== objectId) {
      const previousLine = this.trailLines.get(previousHighlightId);
      if (previousLine && previousLine.userData.defaultColor) {
        (previousLine.material as THREE.LineBasicMaterial).color.copy(
          previousLine.userData.defaultColor,
        );
      }
    }

    // Apply new highlight
    if (objectId) {
      const line = this.trailLines.get(objectId);
      if (line) {
        this.applyHighlight(objectId, line);
      }
    }
  }

  /**
   * Helper method to apply highlighting to a specific line.
   *
   * @param objectId - ID of the object whose line should be highlighted
   * @param line - The line object to highlight
   * @private
   */
  private applyHighlight(objectId: string, line: THREE.Line): void {
    if (!(line.material instanceof THREE.LineBasicMaterial)) return;

    if (this.highlightedObjectId === objectId) {
      if (!line.userData.defaultColor) {
        line.userData.defaultColor = line.material.color.clone();
      }
      line.material.color.copy(this.highlightColor);
    } else if (line.userData.defaultColor) {
      line.material.color.copy(line.userData.defaultColor);
    }
  }

  /**
   * Cleans up all trail lines and releases resources.
   */
  dispose(): void {
    this.trailLines.forEach((line, id) => this.removeTrail(id));
    this.trailLines.clear();
    this.positionHistory.clear();
    this.lineBuilder.clear();
  }

  /**
   * Limits memory usage by trimming excess history.
   *
   * @param maxHistoryLength - Maximum history length to enforce
   */
  limitHistoryMemory(maxHistoryLength: number): void {
    this.positionHistory.forEach((history, id) => {
      if (history.length > maxHistoryLength) {
        this.positionHistory.set(id, history.slice(-maxHistoryLength));
      }
    });
  }
}
