import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineBuilder } from "../utils/LineBuilder";

/**
 * Available methods for smoothing trail lines
 */
export enum SmoothingMethod {
  /**
   * No smoothing, just uses raw points (fastest)
   */
  NONE = "none",

  /**
   * Uses a simple Chaikin curve algorithm (fast, decent results)
   */
  CHAIKIN = "chaikin",

  /**
   * Uses Three.js CatmullRom spline (slower, best results)
   */
  CATMULL_ROM = "catmullRom",
}

/**
 * Configuration options for trail rendering
 */
export interface TrailOptions {
  /**
   * Method to use for smoothing trail lines
   * @default SmoothingMethod.NONE
   */
  smoothingMethod?: SmoothingMethod;

  /**
   * Number of subdivisions to create when smoothing is enabled
   * Higher values = smoother curves but more performance impact
   * @default 1 for Chaikin, 8 for CatmullRom
   */
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
    smoothingMethod: SmoothingMethod.NONE,
    smoothingSubdivisions: 6, // Default to 1 for Chaikin method
  };

  private reusableSmoothedPointsArray: THREE.Vector3[] = [];
  private reusablePointForCurve: THREE.Vector3 = new THREE.Vector3();

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

    if (
      this.options.smoothingMethod !== SmoothingMethod.NONE &&
      maxHistoryLength >= 3
    ) {
      // For CatmullRom we need more buffer space due to the curve complexity
      let multiplier =
        this.options.smoothingMethod === SmoothingMethod.CATMULL_ROM
          ? this.options.smoothingSubdivisions || 8
          : (this.options.smoothingSubdivisions || 1) * 2; // For Chaikin, each iteration roughly doubles points

      requiredBufferSize = Math.max(1, maxHistoryLength - 1) * multiplier;
    } else {
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

      if (
        history.length < 3 ||
        this.options.smoothingMethod === SmoothingMethod.NONE
      ) {
        pointsToDraw = history; // Use raw history points
      } else if (this.options.smoothingMethod === SmoothingMethod.CHAIKIN) {
        pointsToDraw = this.generateChaikinSmoothedPoints(history);
      } else {
        // SmoothingMethod.CATMULL_ROM
        pointsToDraw = this.generateCatmullRomPoints(history);
      }

      this.lineBuilder.updateLine(line, pointsToDraw, pointsToDraw.length);
    }

    // Update visibility
    line.visible = this.visualizationVisible;

    // Apply highlighting if needed
    this.applyHighlight(objectId, line);
  }

  /**
   * Generates smoothed points using the Chaikin curve algorithm.
   * This is a lightweight alternative to CatmullRom splines.
   *
   * @param points - Original control points
   * @returns Smoothed points
   */
  private generateChaikinSmoothedPoints(
    points: THREE.Vector3[],
  ): THREE.Vector3[] {
    if (points.length < 2) return [...points];

    // Start with original points
    let result = [...points];

    // Number of smoothing iterations (1-2 usually sufficient)
    const iterations = this.options.smoothingSubdivisions || 1;

    // For each iteration of the algorithm
    for (let iter = 0; iter < iterations; iter++) {
      const smoothed: THREE.Vector3[] = [];

      // Always keep the first point
      smoothed.push(result[0].clone());

      // For each segment between points, create two new points
      for (let i = 0; i < result.length - 1; i++) {
        const p0 = result[i];
        const p1 = result[i + 1];

        // Q is 1/4 along the segment from p0 to p1
        const q = new THREE.Vector3().lerpVectors(p0, p1, 0.25);

        // R is 3/4 along the segment from p0 to p1
        const r = new THREE.Vector3().lerpVectors(p0, p1, 0.75);

        smoothed.push(q, r);
      }

      // Always keep the last point
      smoothed.push(result[result.length - 1].clone());

      // Update result for next iteration or final output
      result = smoothed;
    }

    return result;
  }

  /**
   * Generates smoothed points using Three.js CatmullRom spline.
   * More visually appealing but computationally expensive.
   *
   * @param points - Original control points
   * @returns Smoothed points
   */
  private generateCatmullRomPoints(points: THREE.Vector3[]): THREE.Vector3[] {
    // Use the existing getPoints method for CatmullRom
    // It's more expensive but gives better results when quality matters
    if (points.length < 3) return [...points];

    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);

    const segments =
      Math.max(1, points.length - 1) *
      (this.options.smoothingSubdivisions || 8);

    // Directly return the points for simplicity
    // This is less optimized but used less frequently when the app is configured for performance
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
          // Recalculate required buffer size based on new options
          let requiredBufferSize: number;
          const maxHistoryLength = history.length; // Current history length as reference
          if (
            this.options.smoothingMethod !== SmoothingMethod.NONE &&
            maxHistoryLength >= 3
          ) {
            let multiplier =
              this.options.smoothingMethod === SmoothingMethod.CATMULL_ROM
                ? this.options.smoothingSubdivisions || 8
                : (this.options.smoothingSubdivisions || 1) * 2; // For Chaikin, each iteration roughly doubles points

            requiredBufferSize = Math.max(1, maxHistoryLength - 1) * multiplier;
          } else {
            requiredBufferSize = maxHistoryLength;
          }
          requiredBufferSize = Math.max(1, requiredBufferSize);
          this.lineBuilder.resizeLineBuffer(line, requiredBufferSize);

          let pointsToDraw: THREE.Vector3[];
          if (
            history.length < 3 ||
            this.options.smoothingMethod === SmoothingMethod.NONE
          ) {
            pointsToDraw = history; // Use raw history points
          } else if (this.options.smoothingMethod === SmoothingMethod.CHAIKIN) {
            pointsToDraw = this.generateChaikinSmoothedPoints(history);
          } else {
            // SmoothingMethod.CATMULL_ROM
            pointsToDraw = this.generateCatmullRomPoints(history);
          }
          this.lineBuilder.updateLine(line, pointsToDraw, pointsToDraw.length);
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
    this.reusableSmoothedPointsArray.length = 0; // Clear reusable array on dispose
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
