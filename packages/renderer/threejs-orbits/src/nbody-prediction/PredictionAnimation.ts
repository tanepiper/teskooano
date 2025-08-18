import * as THREE from "three";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";

/**
 * Handles animation state management for prediction lines.
 * Extracted from PredictionManager to improve modularity and testability.
 */
export class PredictionAnimation {
  // --- Animation State ---
  /** The currently displayed points of the prediction line. */
  private currentPoints: THREE.Vector3[] = [];
  /** The target points for the animation. */
  private targetPoints: THREE.Vector3[] = [];
  /** Flag to indicate if the line is currently animating. */
  private isAnimating: boolean = false;
  /** Progress of the current animation (0 to 1). */
  private animationProgress: number = 0;
  /** Duration of the smoothing animation in seconds. */
  private readonly animationDuration: number = 0.5;
  /** ID of the currently highlighted object, to know which line to animate. */
  private highlightedObjectId: string | null = null;
  /** Color for the highlighted prediction line. */
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);
  // -----------------------

  /** Line builder utility for efficient line creation and updates */
  private lineBuilder: LineHelper;

  constructor() {
    this.lineBuilder = new LineHelper();
  }

  /**
   * Main update loop, called every frame to drive animation.
   */
  update(deltaTime: number): void {
    if (!this.isAnimating) return;

    this.animationProgress += deltaTime;
    const t = Math.min(this.animationProgress / this.animationDuration, 1);

    if (t >= 1) {
      this.isAnimating = false;
      this.currentPoints = this.targetPoints;
    }
  }

  /**
   * Starts animation for a prediction line.
   */
  startAnimation(
    objectId: string,
    newPoints: THREE.Vector3[],
    line: THREE.Line,
  ): void {
    if (newPoints.length === 0) {
      return;
    }

    // If there's no current line or points, draw it instantly.
    if (this.currentPoints.length === 0) {
      this.currentPoints = newPoints;
      this.targetPoints = newPoints;
      this.updateLine(line, newPoints);
      return;
    }

    // Ensure arrays are the same length for interpolation
    if (this.currentPoints.length !== newPoints.length) {
      // If lengths differ, we can't smoothly animate. Just snap to the new line.
      this.currentPoints = newPoints;
      this.updateLine(line, newPoints);
    }

    this.targetPoints = newPoints;
    this.animationProgress = 0;
    this.isAnimating = true;
    this.highlightedObjectId = objectId;
  }

  /**
   * Updates the line with interpolated points during animation.
   */
  updateLineDuringAnimation(line: THREE.Line): void {
    if (!this.isAnimating) return;

    const t = Math.min(this.animationProgress / this.animationDuration, 1);

    const interpolatedPoints = this.currentPoints.map((p, i) => {
      if (this.targetPoints[i]) {
        return p.clone().lerp(this.targetPoints[i], t);
      }
      return p; // Should not happen if arrays are same length
    });

    this.updateLine(line, interpolatedPoints);
  }

  /**
   * Updates a line with new points.
   */
  private updateLine(line: THREE.Line, points: THREE.Vector3[]): void {
    this.lineBuilder.updateLine(line, points, points.length);
  }

  /**
   * Checks if animation is currently running.
   */
  isAnimationRunning(): boolean {
    return this.isAnimating;
  }

  /**
   * Gets the currently highlighted object ID.
   */
  getHighlightedObjectId(): string | null {
    return this.highlightedObjectId;
  }

  /**
   * Sets the highlighted object ID.
   */
  setHighlightedObjectId(objectId: string | null): void {
    this.highlightedObjectId = objectId;
  }

  /**
   * Gets the current animation progress (0 to 1).
   */
  getAnimationProgress(): number {
    return this.animationProgress;
  }

  /**
   * Gets the animation duration in seconds.
   */
  getAnimationDuration(): number {
    return this.animationDuration;
  }

  /**
   * Gets the current points.
   */
  getCurrentPoints(): THREE.Vector3[] {
    return this.currentPoints;
  }

  /**
   * Gets the target points.
   */
  getTargetPoints(): THREE.Vector3[] {
    return this.targetPoints;
  }

  /**
   * Resets the animation state.
   */
  reset(): void {
    this.isAnimating = false;
    this.animationProgress = 0;
    this.currentPoints = [];
    this.targetPoints = [];
    this.highlightedObjectId = null;
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    this.lineBuilder.clear();
  }
}
