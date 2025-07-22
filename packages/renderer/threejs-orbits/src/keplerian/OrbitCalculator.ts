import {
  AU_METERS,
  SCALE,
  type RenderableCelestialObject,
  CelestialType,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { calculateKeplerianPositionAtTrueAnomaly } from "@teskooano/core-physics";
import type { OrbitalParameters } from "@teskooano/data-types";

/**
 * Utility class for calculating orbital paths using Keplerian orbital mechanics.
 *
 * This provides methods to convert orbital parameters into visual 3D points
 * for rendering elliptical orbit paths.
 */
export class OrbitCalculator {
  /**
   * Calculates the optimal number of steps for an orbit line based on its
   * size, ensuring a consistent visual density. Larger orbits get more points.
   *
   * @param object - The celestial object whose orbit is being calculated.
   * @returns The calculated number of steps, clamped within a min/max range.
   */
  private static calculateOrbitSteps(
    object: RenderableCelestialObject,
  ): number {
    const MIN_STEPS = 256;
    const MAX_STEPS = 1024; // Lowered from 4096 to prevent performance issues
    // Use a higher density for Keplerian lines to ensure they are always smooth
    const POINTS_PER_AU = 500; // Lowered from 3000

    if (!object.orbit) {
      return MIN_STEPS;
    }

    let steps: number;

    if (object.orbit.eccentricity > 1) {
      // Hyperbolic orbit: use a fixed number of steps since it's an open curve
      // The range is limited by the true anomaly calculation, so we need enough points for smooth rendering
      steps = MAX_STEPS; // Use maximum steps for smooth hyperbolic curves
    } else {
      // Elliptical/parabolic orbit: approximate the circumference
      const circumferenceAU =
        (2 * Math.PI * object.orbit.realSemiMajorAxis_m) / AU_METERS;
      steps = Math.round(circumferenceAU * POINTS_PER_AU);
    }

    // For comets, which can have extreme eccentricity, we boost the steps
    // to ensure the sharp turn around the periapsis is smooth.
    const finalSteps =
      object.type === CelestialType.COMET ? steps * 1.2 : steps;

    // Clamp the result to prevent excessively low or high step counts.
    return Math.max(MIN_STEPS, Math.min(Math.round(finalSteps), MAX_STEPS));
  }

  /**
   * Calculates the 3D points representing a Keplerian orbit based on orbital parameters.
   *
   * This function now uses the centralized physics calculation to ensure the rendered
   * line perfectly matches the object's "on-rails" movement.
   *
   * The calculation is performed relative to the central body (focus) assumed to be at the origin (0,0,0).
   * The returned points are scaled from real-world meters to the visual scene units.
   *
   * @param orbitalParameters - The Keplerian orbital elements of the object.
   * @param object - The full renderable celestial object, used to determine step count.
   * @returns An array of `OSVector3` points representing the orbit in scaled visual units, relative to the focus at (0,0,0). Returns an empty array if essential parameters (period, semi-major axis) are invalid.
   */
  public static calculateOrbitPoints(
    orbitalParameters: OrbitalParameters,
    object: RenderableCelestialObject,
  ): OSVector3[] {
    if (
      !orbitalParameters ||
      typeof orbitalParameters.realSemiMajorAxis_m === "undefined" ||
      orbitalParameters.realSemiMajorAxis_m === 0
    ) {
      console.warn(
        `[OrbitCalc] Invalid orbital parameters for ${object.celestialObjectId}. Cannot calculate orbit points.`,
      );
      return [];
    }

    // For hyperbolic orbits, period_s is 0 (no period), which is valid
    if (
      orbitalParameters.eccentricity <= 1 &&
      (typeof orbitalParameters.period_s === "undefined" ||
        orbitalParameters.period_s === 0)
    ) {
      console.warn(
        `[OrbitCalc] Invalid orbital parameters for ${object.celestialObjectId}. Elliptical/parabolic orbits must have a period.`,
      );
      return [];
    }

    const points: OSVector3[] = [];
    const segments = this.calculateOrbitSteps(object);

    // For hyperbolic orbits, we need to limit the true anomaly range
    // to avoid infinite distances and show a reasonable portion of the trajectory
    let trueAnomalyRange: number;
    if (orbitalParameters.eccentricity > 1) {
      // Hyperbolic orbit: limit to a reasonable range around periapsis
      // Calculate the angle where the object is at a reasonable distance (e.g., 10 AU)
      const maxDistanceAU = 10;
      const maxDistance_m = maxDistanceAU * AU_METERS;
      const cosMaxAngle =
        ((Math.abs(orbitalParameters.realSemiMajorAxis_m) *
          (orbitalParameters.eccentricity * orbitalParameters.eccentricity -
            1)) /
          maxDistance_m -
          1) /
        orbitalParameters.eccentricity;
      const maxAngle = Math.acos(Math.max(-1, Math.min(1, cosMaxAngle)));
      trueAnomalyRange = 2 * maxAngle;
    } else {
      // Elliptical/parabolic orbit: full 2π range
      trueAnomalyRange = 2 * Math.PI;
    }

    for (let i = 0; i <= segments; i++) {
      // Iterate through the true anomaly (angle) instead of time
      const trueAnomaly_rad = (i / segments) * trueAnomalyRange;

      // Use the new calculator to get the real-world position in meters
      const realRelativePosition = calculateKeplerianPositionAtTrueAnomaly(
        orbitalParameters,
        trueAnomaly_rad,
      );

      // Scale the real position to the scene's rendering scale
      const scaledRelativePosition = realRelativePosition.multiplyScalar(
        SCALE.RENDER_SCALE_AU / AU_METERS,
      );

      points.push(scaledRelativePosition);
    }

    // The loop from 0 to 2*PI naturally closes the loop, so no need to clone the first point.
    return points;
  }
}
