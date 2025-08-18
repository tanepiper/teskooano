import * as THREE from "three";
import { TrailCurveType, TrailCurveConfig } from "./TrailCurveConfig";

/**
 * Utility class for interpolating trail points into smooth curves.
 *
 * This class provides various curve interpolation methods optimized for
 * orbital visualization, including Catmull-Rom splines, orbital-aware
 * smoothing, and adaptive curve selection.
 */
export class TrailCurveInterpolator {
  /**
   * Interpolates trail points using the specified curve configuration.
   *
   * @param points - Raw trail points
   * @param config - Curve configuration
   * @returns Interpolated curve points
   */
  static interpolate(
    points: THREE.Vector3[],
    config: TrailCurveConfig,
  ): THREE.Vector3[] {
    if (points.length < 2) {
      return points;
    }

    switch (config.type) {
      case TrailCurveType.Linear:
        return points; // No interpolation for linear trails

      case TrailCurveType.Smooth:
        return this.createSmoothCurve(points, config);

      case TrailCurveType.Orbital:
        return this.createOrbitalCurve(points, config);

      case TrailCurveType.Adaptive:
        return this.createAdaptiveCurve(points, config);

      default:
        return points;
    }
  }

  /**
   * Creates a smooth curve from raw trail points using Catmull-Rom spline interpolation.
   *
   * @param points - Raw trail points
   * @param config - Curve configuration
   * @returns Interpolated curve points
   */
  static createSmoothCurve(
    points: THREE.Vector3[],
    config: TrailCurveConfig,
  ): THREE.Vector3[] {
    if (points.length < 3) {
      return points; // Need at least 3 points for curve interpolation
    }

    // Create Catmull-Rom curve
    const curve = new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      config.tension || 0.5,
    );

    // Calculate number of segments based on curve length and quality
    const totalSegments = Math.max(
      points.length * (config.segments || 8),
      Math.min(100, points.length * 4), // Ensure reasonable minimum/maximum
    );

    return curve.getPoints(totalSegments);
  }

  /**
   * Creates an orbital-aware curve that accounts for gravitational motion patterns.
   *
   * @param points - Raw trail points
   * @param config - Curve configuration
   * @returns Interpolated curve points optimized for orbital motion
   */
  static createOrbitalCurve(
    points: THREE.Vector3[],
    config: TrailCurveConfig,
  ): THREE.Vector3[] {
    if (points.length < 4) {
      return this.createSmoothCurve(points, config);
    }

    // For orbital curves, we use a combination of Catmull-Rom and custom smoothing
    // that accounts for the expected elliptical nature of orbits

    // Create base Catmull-Rom curve
    const baseCurve = new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      config.tension || 0.5,
    );

    // Apply orbital-specific smoothing
    const smoothing = config.smoothing || 0.3;
    const segments = Math.max(points.length * (config.segments || 8), 50);

    const curvePoints = baseCurve.getPoints(segments);

    // Apply additional smoothing for orbital motion
    if (smoothing > 0) {
      return this.applyOrbitalSmoothing(curvePoints, smoothing);
    }

    return curvePoints;
  }

  /**
   * Creates an adaptive curve that automatically chooses the best interpolation method.
   *
   * @param points - Raw trail points
   * @param config - Curve configuration
   * @returns Interpolated curve points
   */
  static createAdaptiveCurve(
    points: THREE.Vector3[],
    config: TrailCurveConfig,
  ): THREE.Vector3[] {
    const threshold = config.adaptiveThreshold || 10;

    if (points.length < threshold) {
      return points; // Too few points for meaningful curves
    }

    // For adaptive curves, we'll use smooth interpolation as default
    // The actual object type determination would happen in the TrailManager
    return this.createSmoothCurve(points, config);
  }

  /**
   * Applies orbital-specific smoothing to curve points.
   *
   * @param points - Curve points to smooth
   * @param smoothing - Smoothing factor (0-1)
   * @returns Smoothed curve points
   */
  static applyOrbitalSmoothing(
    points: THREE.Vector3[],
    smoothing: number,
  ): THREE.Vector3[] {
    if (points.length < 3) return points;

    const smoothed = [points[0]]; // Keep first point

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      // Calculate smoothed position using weighted average
      const smoothedPoint = new THREE.Vector3()
        .addScaledVector(prev, smoothing * 0.25)
        .addScaledVector(current, 1 - smoothing * 0.5)
        .addScaledVector(next, smoothing * 0.25);

      smoothed.push(smoothedPoint);
    }

    smoothed.push(points[points.length - 1]); // Keep last point
    return smoothed;
  }

  /**
   * Creates a curve that follows orbital mechanics more closely.
   * This method attempts to fit elliptical curves to the trail data.
   *
   * @param points - Raw trail points
   * @param config - Curve configuration
   * @returns Interpolated curve points optimized for orbital motion
   */
  static createEllipticalCurve(
    points: THREE.Vector3[],
    config: TrailCurveConfig,
  ): THREE.Vector3[] {
    if (points.length < 5) {
      return this.createSmoothCurve(points, config);
    }

    // For elliptical curves, we'll use a more sophisticated approach
    // that attempts to fit the points to an elliptical pattern

    // First, create a smooth base curve
    const baseCurve = this.createSmoothCurve(points, config);

    // Then apply elliptical correction
    return this.applyEllipticalCorrection(baseCurve, points);
  }

  /**
   * Applies elliptical correction to make curves more orbital-like.
   *
   * @param curvePoints - Points from base curve
   * @param originalPoints - Original trail points
   * @returns Elliptically corrected curve points
   */
  private static applyEllipticalCorrection(
    curvePoints: THREE.Vector3[],
    originalPoints: THREE.Vector3[],
  ): THREE.Vector3[] {
    if (curvePoints.length < 3) return curvePoints;

    // Calculate the center of mass of the original points
    const center = new THREE.Vector3();
    for (const point of originalPoints) {
      center.add(point);
    }
    center.divideScalar(originalPoints.length);

    // Calculate average radius
    let totalRadius = 0;
    for (const point of originalPoints) {
      totalRadius += point.distanceTo(center);
    }
    const avgRadius = totalRadius / originalPoints.length;

    // Apply elliptical correction by adjusting points to maintain consistent radius
    const corrected = curvePoints.map((point) => {
      const direction = point.clone().sub(center).normalize();
      const distance = point.distanceTo(center);

      // Blend between original distance and average radius
      const correctedDistance = THREE.MathUtils.lerp(distance, avgRadius, 0.3);

      return center.clone().add(direction.multiplyScalar(correctedDistance));
    });

    return corrected;
  }

  /**
   * Creates a curve with variable tension based on velocity changes.
   *
   * @param points - Raw trail points
   * @param config - Curve configuration
   * @param velocities - Optional velocity data for each point
   * @returns Interpolated curve points with variable tension
   */
  static createVelocityAwareCurve(
    points: THREE.Vector3[],
    config: TrailCurveConfig,
    velocities?: THREE.Vector3[],
  ): THREE.Vector3[] {
    if (points.length < 3) {
      return points;
    }

    if (!velocities || velocities.length !== points.length) {
      // Fall back to smooth curve if no velocity data
      return this.createSmoothCurve(points, config);
    }

    // Create multiple curve segments with different tensions based on velocity
    const segments: THREE.Vector3[][] = [];
    let currentSegment: THREE.Vector3[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const velocity = velocities[i];
      const speed = velocity.length();

      // Use higher tension for high-speed segments (straighter lines)
      // Use lower tension for low-speed segments (curvier lines)
      const tension = THREE.MathUtils.clamp(1 - speed / 1000, 0.1, 0.9);

      currentSegment.push(points[i]);

      // Create curve segment if we have enough points or at the end
      if (currentSegment.length >= 3 || i === points.length - 1) {
        const segmentCurve = new THREE.CatmullRomCurve3(
          currentSegment,
          false,
          "catmullrom",
          tension,
        );

        const segmentPoints = segmentCurve.getPoints(
          Math.max(currentSegment.length * 2, 10),
        );

        segments.push(segmentPoints);
        currentSegment = [points[i]]; // Start new segment
      }
    }

    // Combine all segments
    const combined: THREE.Vector3[] = [];
    for (const segment of segments) {
      combined.push(...segment);
    }

    return combined;
  }

  /**
   * Creates a curve optimized for specific celestial object types.
   *
   * @param points - Raw trail points
   * @param objectType - Type of celestial object
   * @param config - Curve configuration
   * @returns Interpolated curve points optimized for the object type
   */
  static createTypeOptimizedCurve(
    points: THREE.Vector3[],
    objectType: string,
    config: TrailCurveConfig,
  ): THREE.Vector3[] {
    switch (objectType) {
      case "PLANET":
      case "MOON":
        return this.createOrbitalCurve(points, config);

      case "STAR":
        // Stars typically have more linear motion, use smoother curves
        return this.createSmoothCurve(points, {
          ...config,
          tension: (config.tension || 0.5) * 0.7, // Lower tension for smoother curves
          smoothing: (config.smoothing || 0.3) * 1.2, // More smoothing
        });

      case "ASTEROID":
      case "COMET":
        // Asteroids and comets can have more erratic motion
        return this.createSmoothCurve(points, {
          ...config,
          tension: (config.tension || 0.5) * 1.3, // Higher tension for straighter lines
          smoothing: (config.smoothing || 0.3) * 0.8, // Less smoothing
        });

      default:
        return this.createAdaptiveCurve(points, config);
    }
  }
}
