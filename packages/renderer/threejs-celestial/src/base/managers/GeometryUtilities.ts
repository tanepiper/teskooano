import type {
  RenderableCelestialObject,
  DeviceTier,
} from "@teskooano/data-types";
import * as THREE from "three";
import type { DetailLevel } from "../types";

/**
 * Performance configuration for geometry segment calculations
 */
export interface PerformanceConfig {
  /** Target FPS for performance calculations */
  targetFPS?: number;
  /** Current FPS (will be updated dynamically) */
  currentFPS?: number;
  /** Whether to enable performance-based segment reduction */
  enablePerformanceOptimization?: boolean;
  /** Multiplier for segment reduction when performance is poor (0.5 = 50% reduction) */
  performanceReductionMultiplier?: number;
  /** Minimum segments to maintain even under poor performance */
  minimumSegments?: number;
  /** Device performance tier */
  deviceTier?: DeviceTier;
  /** Whether to enable adaptive segment scaling based on object size */
  enableAdaptiveScaling?: boolean;
  /** Distance-based segment reduction factor */
  distanceReductionFactor?: number;
}

/**
 * Utility class providing geometry-related helper functions for celestial renderers.
 * Centralizes common geometry operations like segment calculations and position utilities.
 * Now includes comprehensive performance-based optimizations.
 */
export class GeometryUtilities {
  private static performanceConfig: PerformanceConfig = {
    targetFPS: 60,
    currentFPS: 60,
    enablePerformanceOptimization: true,
    performanceReductionMultiplier: 0.6,
    minimumSegments: 4,
    deviceTier: "medium",
    enableAdaptiveScaling: true,
    distanceReductionFactor: 0.8,
  };

  /**
   * Updates the performance configuration for dynamic segment calculations
   */
  public static updatePerformanceConfig(
    config: Partial<PerformanceConfig>,
  ): void {
    this.performanceConfig = { ...this.performanceConfig, ...config };
  }

  /**
   * Gets the current performance configuration
   */
  public static getPerformanceConfig(): PerformanceConfig {
    return { ...this.performanceConfig };
  }

  /**
   * Calculates performance-based segment reduction factor
   */
  private static getPerformanceReductionFactor(): number {
    if (!this.performanceConfig.enablePerformanceOptimization) {
      return 1.0;
    }

    const { targetFPS, currentFPS, performanceReductionMultiplier } =
      this.performanceConfig;

    if (!currentFPS || !targetFPS || currentFPS >= targetFPS) {
      return 1.0;
    }

    // Calculate reduction based on FPS drop with smoother curve
    const fpsRatio = currentFPS / targetFPS;
    const reductionFactor =
      1.0 - (1.0 - fpsRatio) * (performanceReductionMultiplier ?? 0.6);

    return Math.max(0.3, reductionFactor); // Minimum 30% of original segments
  }

  /**
   * Gets device-based segment multiplier
   */
  private static getDeviceSegmentMultiplier(): number {
    switch (this.performanceConfig.deviceTier) {
      case "low":
        return 0.4; // 40% of standard segments for low-end devices
      case "medium":
        return 0.7; // 70% of standard segments for mid-range devices
      case "high":
        return 1.0; // 100% of standard segments for high-end devices
      default:
        return 0.7;
    }
  }

  /**
   * Calculates adaptive scaling based on object size and distance
   */
  private static getAdaptiveScalingFactor(
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number {
    if (!this.performanceConfig.enableAdaptiveScaling || !object || !camera) {
      return 1.0;
    }

    // Calculate distance from camera to object
    const distance = camera.position.distanceTo(object.position);
    const objectRadius = object.radius || 1;

    // Reduce segments for distant objects
    const distanceFactor = Math.max(
      0.3,
      Math.min(1.0, distance / (objectRadius * 100)),
    );

    return (
      distanceFactor * (this.performanceConfig.distanceReductionFactor || 0.8)
    );
  }

  /**
   * Maps a qualitative detail level (e.g., "high") to a concrete number of segments for creating geometries.
   * Now includes comprehensive performance-based optimizations.
   * @param detailLevel A string representing the desired detail level.
   * @param defaultSegments A fallback number of segments if the detail level is not specified.
   * @param object Optional celestial object for adaptive scaling
   * @param camera Optional camera for distance-based optimization
   * @returns The calculated number of segments.
   */
  public static getSegmentsForDetailLevel(
    detailLevel?: DetailLevel | string,
    defaultSegments: number = 32,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number {
    if (!detailLevel) return defaultSegments;

    let baseSegments: number;
    switch (detailLevel) {
      case "high":
        baseSegments = 64;
        break;
      case "medium":
        baseSegments = 32;
        break;
      case "low":
        baseSegments = 16;
        break;
      case "very-low":
        baseSegments = 8;
        break;
      default:
        baseSegments = defaultSegments;
    }

    // Apply all optimization factors
    const performanceFactor = this.getPerformanceReductionFactor();
    const deviceFactor = this.getDeviceSegmentMultiplier();
    const adaptiveFactor = this.getAdaptiveScalingFactor(object, camera);
    const optimizedSegments = Math.floor(
      baseSegments * performanceFactor * deviceFactor * adaptiveFactor,
    );

    // Ensure minimum segments
    return Math.max(
      this.performanceConfig.minimumSegments || 4,
      optimizedSegments,
    );
  }

  /**
   * Gets optimized segments for high-performance scenarios (planets, gas giants)
   * Optimized for objects that need high detail but can benefit from performance scaling
   */
  public static getOptimizedHighDetailSegments(
    detailLevel?: DetailLevel | string,
    defaultSegments: number = 64,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number {
    if (!detailLevel) return defaultSegments;

    let baseSegments: number;
    switch (detailLevel) {
      case "high":
        baseSegments = 80; // Optimized from 96
        break;
      case "medium":
        baseSegments = 40; // Optimized from 48
        break;
      case "low":
        baseSegments = 20; // Optimized from 24
        break;
      case "very-low":
        baseSegments = 10; // Optimized from 12
        break;
      default:
        baseSegments = defaultSegments;
    }

    // Apply all optimization factors
    const performanceFactor = this.getPerformanceReductionFactor();
    const deviceFactor = this.getDeviceSegmentMultiplier();
    const adaptiveFactor = this.getAdaptiveScalingFactor(object, camera);
    const optimizedSegments = Math.floor(
      baseSegments * performanceFactor * deviceFactor * adaptiveFactor,
    );

    return Math.max(
      this.performanceConfig.minimumSegments || 4,
      optimizedSegments,
    );
  }

  /**
   * Gets optimized segments for ring systems (typically higher detail)
   * Optimized for complex ring geometries that need more segments
   */
  public static getOptimizedRingSegments(
    detailLevel?: DetailLevel | string,
    defaultSegments: number = 128,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number {
    if (!detailLevel) return defaultSegments;

    let baseSegments: number;
    switch (detailLevel) {
      case "high":
        baseSegments = 144; // Optimized from 192
        break;
      case "medium":
        baseSegments = 72; // Optimized from 96
        break;
      case "low":
        baseSegments = 36; // Optimized from 48
        break;
      case "very-low":
        baseSegments = 18; // Optimized from 24
        break;
      default:
        baseSegments = defaultSegments;
    }

    // Apply all optimization factors
    const performanceFactor = this.getPerformanceReductionFactor();
    const deviceFactor = this.getDeviceSegmentMultiplier();
    const adaptiveFactor = this.getAdaptiveScalingFactor(object, camera);
    const optimizedSegments = Math.floor(
      baseSegments * performanceFactor * deviceFactor * adaptiveFactor,
    );

    return Math.max(
      this.performanceConfig.minimumSegments || 8,
      optimizedSegments,
    );
  }

  /**
   * Gets optimized segments for stars (typically lower detail needed)
   * Optimized for spherical objects that don't need high geometric detail
   */
  public static getOptimizedStarSegments(
    detailLevel?: DetailLevel | string,
    defaultSegments: number = 32,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number {
    if (!detailLevel) return defaultSegments;

    let baseSegments: number;
    switch (detailLevel) {
      case "high":
        baseSegments = 40; // Optimized from 48
        break;
      case "medium":
        baseSegments = 20; // Optimized from 24
        break;
      case "low":
        baseSegments = 10; // Optimized from 12
        break;
      case "very-low":
        baseSegments = 6; // Optimized from 6
        break;
      default:
        baseSegments = defaultSegments;
    }

    // Apply all optimization factors
    const performanceFactor = this.getPerformanceReductionFactor();
    const deviceFactor = this.getDeviceSegmentMultiplier();
    const adaptiveFactor = this.getAdaptiveScalingFactor(object, camera);
    const optimizedSegments = Math.floor(
      baseSegments * performanceFactor * deviceFactor * adaptiveFactor,
    );

    return Math.max(
      this.performanceConfig.minimumSegments || 4,
      optimizedSegments,
    );
  }

  /**
   * Gets optimized segments for atmosphere effects
   * Optimized for volumetric effects that need moderate detail
   */
  public static getOptimizedAtmosphereSegments(
    detailLevel?: DetailLevel | string,
    defaultSegments: number = 48,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number {
    if (!detailLevel) return defaultSegments;

    let baseSegments: number;
    switch (detailLevel) {
      case "high":
        baseSegments = 56; // Optimized for atmosphere
        break;
      case "medium":
        baseSegments = 32; // Optimized for atmosphere
        break;
      case "low":
        baseSegments = 16; // Optimized for atmosphere
        break;
      case "very-low":
        baseSegments = 8; // Optimized for atmosphere
        break;
      default:
        baseSegments = defaultSegments;
    }

    // Apply all optimization factors
    const performanceFactor = this.getPerformanceReductionFactor();
    const deviceFactor = this.getDeviceSegmentMultiplier();
    const adaptiveFactor = this.getAdaptiveScalingFactor(object, camera);
    const optimizedSegments = Math.floor(
      baseSegments * performanceFactor * deviceFactor * adaptiveFactor,
    );

    return Math.max(
      this.performanceConfig.minimumSegments || 6,
      optimizedSegments,
    );
  }

  /**
   * Gets the world position of a celestial object.
   * @param object The celestial object.
   * @returns A clone of the object's position vector.
   */
  public static getWorldPosition(
    object: RenderableCelestialObject,
  ): THREE.Vector3 {
    return object.position.clone();
  }

  /**
   * Calculates the distance between two celestial objects.
   * @param object1 The first celestial object.
   * @param object2 The second celestial object.
   * @returns The distance between the objects.
   */
  public static getDistanceBetweenObjects(
    object1: RenderableCelestialObject,
    object2: RenderableCelestialObject,
  ): number {
    return object1.position.distanceTo(object2.position);
  }

  /**
   * Calculates the squared distance between two celestial objects (more efficient for comparisons).
   * @param object1 The first celestial object.
   * @param object2 The second celestial object.
   * @returns The squared distance between the objects.
   */
  public static getSquaredDistanceBetweenObjects(
    object1: RenderableCelestialObject,
    object2: RenderableCelestialObject,
  ): number {
    return object1.position.distanceToSquared(object2.position);
  }

  /**
   * Creates a standard sphere geometry with the specified detail level.
   * @param radius The radius of the sphere.
   * @param detailLevel The detail level for the sphere.
   * @returns A THREE.SphereGeometry with appropriate segment count.
   */
  public static createSphereGeometry(
    radius: number,
    detailLevel?: DetailLevel | string,
  ): THREE.SphereGeometry {
    const segments = this.getSegmentsForDetailLevel(detailLevel);
    return new THREE.SphereGeometry(radius, segments, segments);
  }

  /**
   * Creates a standard plane geometry with the specified detail level.
   * @param width The width of the plane.
   * @param height The height of the plane.
   * @param detailLevel The detail level for the plane.
   * @returns A THREE.PlaneGeometry with appropriate segment count.
   */
  public static createPlaneGeometry(
    width: number,
    height: number,
    detailLevel?: DetailLevel | string,
  ): THREE.PlaneGeometry {
    const segments = this.getSegmentsForDetailLevel(detailLevel);
    return new THREE.PlaneGeometry(width, height, segments, segments);
  }

  /**
   * Creates a standard ring geometry with the specified detail level.
   * @param innerRadius The inner radius of the ring.
   * @param outerRadius The outer radius of the ring.
   * @param detailLevel The detail level for the ring.
   * @returns A THREE.RingGeometry with appropriate segment count.
   */
  public static createRingGeometry(
    innerRadius: number,
    outerRadius: number,
    detailLevel?: DetailLevel | string,
  ): THREE.RingGeometry {
    const segments = this.getSegmentsForDetailLevel(detailLevel);
    return new THREE.RingGeometry(innerRadius, outerRadius, segments);
  }

  /**
   * Calculates an appropriate radius scale based on the detail level.
   * Lower detail levels might use simplified representations.
   * @param baseRadius The base radius of the object.
   * @param detailLevel The detail level.
   * @returns The scaled radius.
   */
  public static getScaledRadius(
    baseRadius: number,
    detailLevel?: DetailLevel | string,
  ): number {
    if (!detailLevel) return baseRadius;

    switch (detailLevel) {
      case "high":
        return baseRadius;
      case "medium":
        return baseRadius * 0.98;
      case "low":
        return baseRadius * 0.95;
      case "very-low":
        return baseRadius * 0.9;
      default:
        return baseRadius;
    }
  }

  /**
   * Creates a bounding box for a celestial object.
   * @param object The celestial object.
   * @param padding Optional padding to add to the bounding box.
   * @returns A THREE.Box3 representing the object's bounding box.
   */
  public static createBoundingBox(
    object: RenderableCelestialObject,
    padding: number = 0,
  ): THREE.Box3 {
    const radius = (object.radius || 1) + padding;
    const min = object.position.clone().subScalar(radius);
    const max = object.position.clone().addScalar(radius);
    return new THREE.Box3(min, max);
  }

  /**
   * Creates a bounding sphere for a celestial object.
   * @param object The celestial object.
   * @param padding Optional padding to add to the bounding sphere.
   * @returns A THREE.Sphere representing the object's bounding sphere.
   */
  public static createBoundingSphere(
    object: RenderableCelestialObject,
    padding: number = 0,
  ): THREE.Sphere {
    const radius = (object.radius || 1) + padding;
    return new THREE.Sphere(object.position.clone(), radius);
  }

  /**
   * Determines if a celestial object is within the view frustum of a camera.
   * @param object The celestial object to test.
   * @param camera The camera to test against.
   * @param padding Optional padding for the object's radius.
   * @returns True if the object is likely visible to the camera.
   */
  public static isObjectInViewFrustum(
    object: RenderableCelestialObject,
    camera: THREE.PerspectiveCamera,
    padding: number = 0,
  ): boolean {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4();

    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);

    const sphere = this.createBoundingSphere(object, padding);
    return frustum.intersectsSphere(sphere);
  }

  /**
   * Calculates the apparent size of an object from a camera's perspective.
   * @param object The celestial object.
   * @param camera The viewing camera.
   * @returns The apparent angular size in radians.
   */
  public static getApparentAngularSize(
    object: RenderableCelestialObject,
    camera: THREE.PerspectiveCamera,
  ): number {
    const distance = camera.position.distanceTo(object.position);
    const radius = object.radius || 1;
    return 2 * Math.atan(radius / distance);
  }
}
