import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import {
  RenderableCelestialObject,
  CelestialType,
} from "@teskooano/data-types";
import { CircularBuffer } from "@teskooano/renderer-threejs-helpers";

/**
 * Configuration for orbital data management
 */
export interface OrbitalConfig {
  /** Maximum number of position history points to store */
  maxHistoryPoints: number;
  /** Minimum distance (in scene units) before adding a new position point */
  minDistanceThreshold: number;
  /** Whether this object should show orbit lines */
  showOrbitLines: boolean;
  /** Whether this object should show prediction lines */
  showPredictionLines: boolean;
  /** LOD distance threshold for orbit line visibility */
  orbitLineLODDistance: number;
  /** LOD distance threshold for trail visibility */
  trailLODDistance: number;
}

/**
 * Represents a single position sample in the orbital history
 */
export interface PositionSample {
  /** Position in scene units */
  position: OSVector3;
  /** Timestamp in seconds */
  timestamp: number;
  /** Velocity magnitude in m/s */
  velocityMagnitude: number;
}

/**
 * Manages orbital data for a celestial object including position history,
 * orbit parameters, and LOD-based rendering control.
 *
 * This manager provides efficient memory management using pre-allocated buffers
 * and circular buffers for position history. It integrates with the LOD system
 * to control visibility of orbit lines and trails based on camera distance.
 */
export class OrbitalManager {
  /** Unique identifier for this orbital manager */
  private readonly objectId: string;

  /** Circular buffer for position history */
  private positionHistory: CircularBuffer<PositionSample>;

  /** Current orbital configuration */
  private config: OrbitalConfig;

  /** Current position in scene units */
  private currentPosition: OSVector3 = new OSVector3();

  /** Current velocity in m/s */
  private currentVelocity: OSVector3 = new OSVector3();

  /** Whether this object is currently highlighted */
  private isHighlighted: boolean = false;

  /** Whether this object should show prediction lines */
  private shouldShowPrediction: boolean = false;

  /** Last update time to prevent excessive updates */
  private lastUpdateTime: number = 0;

  /** Minimum time between updates (in seconds) */
  private readonly minUpdateInterval: number = 0.016; // ~60fps

  /** Reusable vectors to avoid allocations */
  private readonly tempVector1: OSVector3 = new OSVector3();
  private readonly tempVector2: OSVector3 = new OSVector3();

  /**
   * Creates a new OrbitalManager instance
   * @param objectId Unique identifier for the celestial object
   * @param config Configuration for orbital data management
   */
  constructor(objectId: string, config: Partial<OrbitalConfig> = {}) {
    this.objectId = objectId;

    // Set default configuration
    this.config = {
      maxHistoryPoints: 1000,
      minDistanceThreshold: 1e-6,
      showOrbitLines: true,
      showPredictionLines: false,
      orbitLineLODDistance: 1000,
      trailLODDistance: 500,
      ...config,
    };

    // Initialize position history with circular buffer
    this.positionHistory = new CircularBuffer<PositionSample>(
      this.config.maxHistoryPoints,
    );
  }

  /**
   * Updates the orbital data with current position and velocity
   * @param object The current renderable celestial object
   * @param time Current simulation time
   */
  update(object: RenderableCelestialObject, time: number): void {
    // Throttle updates to prevent excessive processing
    if (time - this.lastUpdateTime < this.minUpdateInterval) {
      return;
    }
    this.lastUpdateTime = time;

    // Update current position and velocity
    this.currentPosition.setFromArray(object.position.toArray());
    if (object.velocity) {
      this.currentVelocity.setFromArray(object.velocity.toArray());
    } else {
      this.currentVelocity.setZero();
    }

    // Check if we should add a new position sample
    this.addPositionSampleIfNeeded(time);
  }

  /**
   * Adds a new position sample if the object has moved significantly
   * @param time Current simulation time
   */
  private addPositionSampleIfNeeded(time: number): void {
    const lastSample = this.positionHistory.getOrderedItems().pop();

    if (!lastSample) {
      // First sample - always add
      this.addPositionSample(time);
      return;
    }

    // Calculate distance from last sample
    const distance = this.currentPosition.distanceTo(lastSample.position);

    if (distance >= this.config.minDistanceThreshold) {
      this.addPositionSample(time);
    }
  }

  /**
   * Adds a new position sample to the history
   * @param time Current simulation time
   */
  private addPositionSample(time: number): void {
    const sample: PositionSample = {
      position: this.currentPosition.clone(),
      timestamp: time,
      velocityMagnitude: this.currentVelocity.length(),
    };

    this.positionHistory.push(sample);
  }

  /**
   * Gets the current position in scene units
   * @returns Current position as OSVector3
   */
  getCurrentPosition(): OSVector3 {
    return this.currentPosition.clone();
  }

  /**
   * Gets the current velocity in m/s
   * @returns Current velocity as OSVector3
   */
  getCurrentVelocity(): OSVector3 {
    return this.currentVelocity.clone();
  }

  /**
   * Gets the position history as an array of OSVector3
   * @param maxPoints Maximum number of points to return (0 for all)
   * @returns Array of position vectors
   */
  getPositionHistory(maxPoints: number = 0): OSVector3[] {
    const samples = this.positionHistory.getOrderedItems();

    if (maxPoints > 0 && samples.length > maxPoints) {
      return samples.slice(-maxPoints).map((sample) => sample.position);
    }

    return samples.map((sample) => sample.position);
  }

  /**
   * Gets the position history with timestamps
   * @param maxPoints Maximum number of points to return (0 for all)
   * @returns Array of position samples with timestamps
   */
  getPositionHistoryWithTimestamps(maxPoints: number = 0): PositionSample[] {
    const samples = this.positionHistory.getOrderedItems();

    if (maxPoints > 0 && samples.length > maxPoints) {
      return samples.slice(-maxPoints);
    }

    return samples;
  }

  /**
   * Determines if orbit lines should be visible based on LOD
   * @param cameraDistance Distance from camera to object
   * @param objectType Type of celestial object
   * @returns Whether orbit lines should be visible
   */
  shouldShowOrbitLines(
    cameraDistance: number,
    objectType: CelestialType,
  ): boolean {
    if (!this.config.showOrbitLines) {
      return false;
    }

    // Moons have stricter LOD requirements
    if (objectType !== CelestialType.STAR) {
      return cameraDistance <= this.config.orbitLineLODDistance;
    }

    // Stars can show orbit lines from further away
    return cameraDistance <= this.config.orbitLineLODDistance * 2;
  }

  /**
   * Determines if trail lines should be visible based on LOD
   * @param cameraDistance Distance from camera to object
   * @param objectType Type of celestial object
   * @returns Whether trail lines should be visible
   */
  shouldShowTrailLines(
    cameraDistance: number,
    objectType: CelestialType,
  ): boolean {
    // Moons have stricter LOD requirements for trails
    if (objectType !== CelestialType.STAR) {
      return cameraDistance <= this.config.trailLODDistance;
    }

    // Stars can show trails from further away
    return cameraDistance <= this.config.trailLODDistance * 2;
  }

  /**
   * Determines if prediction lines should be visible
   * @returns Whether prediction lines should be visible
   */
  shouldShowPredictionLines(): boolean {
    return this.config.showPredictionLines && this.shouldShowPrediction;
  }

  /**
   * Sets whether this object should show prediction lines
   * @param show Whether to show prediction lines
   */
  setShowPredictionLines(show: boolean): void {
    this.shouldShowPrediction = show;
  }

  /**
   * Sets whether this object is highlighted
   * @param highlighted Whether the object is highlighted
   */
  setHighlighted(highlighted: boolean): void {
    this.isHighlighted = highlighted;
  }

  /**
   * Gets whether this object is highlighted
   * @returns Whether the object is highlighted
   */
  isObjectHighlighted(): boolean {
    return this.isHighlighted;
  }

  /**
   * Updates the orbital configuration
   * @param newConfig New configuration values
   */
  updateConfig(newConfig: Partial<OrbitalConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Resize position history if maxHistoryPoints changed
    if (
      newConfig.maxHistoryPoints &&
      newConfig.maxHistoryPoints !== this.config.maxHistoryPoints
    ) {
      this.positionHistory.resize(newConfig.maxHistoryPoints);
    }
  }

  /**
   * Gets the current orbital configuration
   * @returns Current configuration
   */
  getConfig(): OrbitalConfig {
    return { ...this.config };
  }

  /**
   * Gets the object ID
   * @returns Object ID
   */
  getObjectId(): string {
    return this.objectId;
  }

  /**
   * Gets the number of position samples in history
   * @returns Number of samples
   */
  getHistorySize(): number {
    return this.positionHistory.size;
  }

  /**
   * Clears the position history
   */
  clearHistory(): void {
    this.positionHistory.clear();
  }

  /**
   * Gets memory usage statistics
   * @returns Memory usage information
   */
  getMemoryStats(): {
    historySize: number;
    maxHistoryPoints: number;
    memoryUsage: number;
  } {
    const historySize = this.positionHistory.size;
    const maxHistoryPoints = this.config.maxHistoryPoints;
    const memoryUsage = historySize * 3 * 8; // 3 floats * 8 bytes per sample

    return {
      historySize,
      maxHistoryPoints,
      memoryUsage,
    };
  }

  /**
   * Disposes of resources used by this manager
   */
  dispose(): void {
    this.clearHistory();
  }
}
