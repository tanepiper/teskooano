import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import {
  CSS2DLayerType,
  Layer2DManager,
} from "@teskooano/renderer-threejs-labels";
import { PredictionLabelLayer } from "@teskooano/renderer-threejs-labels";
import {
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  SECONDS_PER_YEAR,
} from "@teskooano/data-values";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Time markers in seconds - these will be placed at fixed time intervals ahead
const TIME_MARKERS = [
  SECONDS_PER_HOUR, // 1h
  SECONDS_PER_HOUR * 6, // 6h
  SECONDS_PER_HOUR * 12, // 12h
  SECONDS_PER_DAY, // 1d
  SECONDS_PER_DAY * 7, // 7d
  SECONDS_PER_DAY * 30, // 30d
  SECONDS_PER_DAY * 60, // 60d
  SECONDS_PER_DAY * 90, // 90d
];

function formatTime(seconds: number): string {
  if (seconds < SECONDS_PER_MINUTE) return `${Math.round(seconds)}s`;
  if (seconds < SECONDS_PER_HOUR)
    return `${Math.round(seconds / SECONDS_PER_MINUTE)}m`;
  if (seconds < SECONDS_PER_DAY)
    return `${Math.round(seconds / SECONDS_PER_HOUR)}h`;
  if (seconds < SECONDS_PER_YEAR)
    return `${Math.round(seconds / SECONDS_PER_DAY)}d`;
  return `${(seconds / SECONDS_PER_YEAR).toFixed(1)}y`;
}

/**
 * Handles prediction label management and visualization.
 * Uses a moving marker system where labels are placed at fixed spatial distances
 * ahead of the current position and removed as the object passes them.
 */
export class PredictionLabels {
  /** A fixed pool of reusable label objects for time markers. */
  private predictionLabels: {
    label: CSS2DObject;
    element: HTMLElement;
    time: number; // The target time for this marker
    active: boolean; // Whether this marker is currently active
    fixedPosition: THREE.Vector3 | null; // Fixed position once set
  }[] = [];

  /** The manager for 2D labels */
  private layer2DManager: Layer2DManager | null = null;

  /** Object manager for scene interaction */
  private objectManager: ObjectManager;

  /** Group for prediction lines */
  private predictionLinesGroup: THREE.Group;

  /** Flag indicating if prediction visualization is enabled */
  private visualizationVisible: boolean = true;

  /** Current position of the tracked object */
  private currentPosition: THREE.Vector3 = new THREE.Vector3();

  /** Current velocity of the tracked object */
  private currentVelocity: THREE.Vector3 = new THREE.Vector3();

  /** Current tracked object for prediction labels */
  private currentObject: RenderableCelestialObject | null = null;

  /** Current Three.js object for prediction labels */
  private currentThreeJsObject: THREE.Object3D | null = null;

  /** Current simulation time for countdown calculations */
  private currentSimulationTime: number = 0;

  constructor(objectManager: ObjectManager, predictionLinesGroup: THREE.Group) {
    this.objectManager = objectManager;
    this.predictionLinesGroup = predictionLinesGroup;
  }

  /**
   * Sets the Layer2DManager instance for creating labels.
   */
  setLayer2DManager(manager: Layer2DManager): void {
    this.layer2DManager = manager;
    this.initializeLabels();
  }

  /**
   * Initializes the prediction labels.
   */
  private initializeLabels(): void {
    if (!this.layer2DManager) return;
    this.disposeLabels(); // Clear any existing labels first

    const labelLayer =
      this.layer2DManager.getLayer(CSS2DLayerType.PREDICTION_LABELS) ||
      new PredictionLabelLayer(this.objectManager.getScene());

    if (!this.layer2DManager.getLayer(CSS2DLayerType.PREDICTION_LABELS)) {
      this.layer2DManager.registerLayer(
        CSS2DLayerType.PREDICTION_LABELS,
        labelLayer,
      );
    }

    TIME_MARKERS.forEach((time) => {
      const labelId = `prediction-label-${time}`;
      const labelText = formatTime(time);
      const label = (labelLayer as PredictionLabelLayer).addLabel(
        labelId,
        new THREE.Vector3(), // Initial position
        labelText,
        time,
      );
      label.visible = false; // Initially hidden

      // Add the label to the scene root instead of the prediction lines group
      // This ensures proper 2D rendering
      this.objectManager.getScene().add(label);

      this.predictionLabels.push({
        label,
        element: label.element,
        time,
        active: false,
        fixedPosition: null,
      });
    });
  }

  /**
   * Gets the prediction labels.
   */
  getPredictionLabels(): { label: CSS2DObject; element: HTMLElement }[] {
    return this.predictionLabels.map(({ label, element }) => ({
      label,
      element,
    }));
  }

  /**
   * Updates the current position and velocity of the tracked object.
   */
  updateCurrentState(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    object?: RenderableCelestialObject,
    threeJsObject?: THREE.Object3D,
    simulationTime?: number,
  ): void {
    this.currentPosition.copy(position);
    this.currentVelocity.copy(velocity);
    this.currentObject = object || null;
    this.currentThreeJsObject = threeJsObject || null;
    if (simulationTime !== undefined) {
      this.currentSimulationTime = simulationTime;
    }
  }

  /**
   * Updates prediction labels with new trajectory data.
   * Places markers at fixed distances ahead of current position.
   */
  updatePredictionLabels(points: THREE.Vector3[], timestamps: number[]): void {
    if (
      !this.layer2DManager ||
      points.length < 2 ||
      this.predictionLabels.length === 0
    ) {
      return;
    }

    // Set the active prediction object on the label layer
    const labelLayer = this.layer2DManager.getLayer(
      CSS2DLayerType.PREDICTION_LABELS,
    ) as PredictionLabelLayer | undefined;

    if (labelLayer) {
      const velocity = this.currentVelocity.length();
      labelLayer.setActivePredictionObject(
        this.currentObject,
        this.currentThreeJsObject,
        velocity,
      );
    }

    // Calculate the total distance of the prediction line from current position
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += points[i].distanceTo(points[i - 1]);
    }

    // Reset all markers
    this.predictionLabels.forEach((marker) => {
      marker.active = false;
      marker.label.visible = false;
    });

    // Find positions for each time marker along the trajectory
    TIME_MARKERS.forEach((targetTime, index) => {
      if (targetTime > timestamps[timestamps.length - 1]) {
        return; // Skip markers beyond the prediction time
      }

      const marker = this.predictionLabels[index];
      if (!marker) return;

      // If this marker already has a fixed position, use it
      if (marker.fixedPosition) {
        marker.label.position.copy(marker.fixedPosition);
        marker.label.visible = this.visualizationVisible;
        marker.active = true;
        return;
      }

      // Find the point along the trajectory at the target time
      let targetPoint: THREE.Vector3 | null = null;

      for (let i = 0; i < timestamps.length - 1; i++) {
        if (timestamps[i] <= targetTime && timestamps[i + 1] >= targetTime) {
          // Interpolate to find the exact position at targetTime
          const t0 = timestamps[i];
          const t1 = timestamps[i + 1];
          const p0 = points[i];
          const p1 = points[i + 1];

          const t = (targetTime - t0) / (t1 - t0);
          targetPoint = p0.clone().lerp(p1, t);
          break;
        }
      }

      if (targetPoint) {
        // Set the fixed position for this marker
        marker.fixedPosition = targetPoint.clone();
        marker.label.position.copy(targetPoint);
        marker.label.userData.localPosition = targetPoint.clone();
        marker.label.visible = this.visualizationVisible;
        marker.active = true;
      }
    });

    // Update countdown times for all active markers
    this.updateCountdownTimes();
  }

  /**
   * Hides all prediction labels.
   */
  hideAllLabels(): void {
    this.predictionLabels.forEach((marker) => {
      marker.label.visible = false;
    });
  }

  /**
   * Sets the visibility state for prediction labels.
   */
  setVisibility(visible: boolean): void {
    this.visualizationVisible = visible;
    if (!visible) {
      this.hideAllLabels();
    } else {
      // Show only active markers
      this.predictionLabels.forEach((marker) => {
        if (marker.active) {
          marker.label.visible = true;
        }
      });
    }
  }

  /**
   * Configures prediction labels for a specific highlighted object.
   */
  configurePredictionLabels(objectId: string): void {
    if (!this.layer2DManager) return;

    const labelLayer = this.layer2DManager.getLayer(
      CSS2DLayerType.PREDICTION_LABELS,
    ) as PredictionLabelLayer | undefined;

    if (labelLayer) {
      // Configure prediction labels for the highlighted object
      // This would need to be implemented based on the specific requirements
      // For now, we'll just ensure the layer is available
    }
  }

  /**
   * Clears all prediction labels.
   */
  clearAllPredictionLabels(): void {
    if (!this.layer2DManager) return;

    const labelLayer = this.layer2DManager.getLayer(
      CSS2DLayerType.PREDICTION_LABELS,
    ) as PredictionLabelLayer | undefined;

    if (labelLayer) {
      // Clear the active prediction object in the label layer
      labelLayer.setActivePredictionObject(null, null, null);
    }

    this.hideAllLabels();

    // Reset marker states and clear fixed positions
    this.predictionLabels.forEach((marker) => {
      marker.active = false;
      marker.fixedPosition = null;
    });
  }

  /**
   * Disposes of all prediction labels.
   */
  private disposeLabels(): void {
    if (!this.layer2DManager) return;
    this.predictionLabels.forEach(({ label }) => {
      // Remove from scene root
      this.objectManager.getScene().remove(label);
    });
    this.predictionLabels = [];
  }

  /**
   * Updates the countdown times for all active markers.
   */
  private updateCountdownTimes(): void {
    this.predictionLabels.forEach((marker) => {
      if (marker.active && marker.fixedPosition) {
        // Calculate time remaining until the object reaches this position
        const timeRemaining = marker.time - this.currentSimulationTime;

        if (timeRemaining > 0) {
          // Update the label text with the countdown
          const countdownText = formatTime(timeRemaining);
          const element = marker.element as any;
          if (element.setText) {
            element.setText(countdownText);
          }
        } else {
          // Object has passed this position, hide the marker
          marker.label.visible = false;
          marker.active = false;
        }
      }
    });
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    this.disposeLabels();
  }
}
