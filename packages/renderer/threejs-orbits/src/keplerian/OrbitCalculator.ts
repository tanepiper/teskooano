import { AU_METERS, SCALE } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { calculateKeplerianStateAtTime } from "@teskooano/core-physics";
import type { OrbitalParameters } from "@teskooano/data-types";

/**
 * Utility class for calculating orbital paths using Keplerian orbital mechanics.
 *
 * This provides methods to convert orbital parameters into visual 3D points
 * for rendering elliptical orbit paths.
 */
export class OrbitCalculator {
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
   * @param segments - The number of segments to divide the orbit into. More segments result in a smoother curve. Defaults to 256.
   * @returns An array of `OSVector3` points representing the orbit in scaled visual units, relative to the focus at (0,0,0). Returns an empty array if essential parameters (period, semi-major axis) are invalid.
   */
  public static calculateOrbitPoints(
    orbitalParameters: OrbitalParameters,
    segments: number = 256,
  ): OSVector3[] {
    if (
      !orbitalParameters ||
      typeof orbitalParameters.period_s === "undefined" ||
      orbitalParameters.period_s === 0 ||
      typeof orbitalParameters.realSemiMajorAxis_m === "undefined" ||
      orbitalParameters.realSemiMajorAxis_m === 0
    ) {
      console.warn(
        `[OrbitCalc] Invalid orbital parameters provided. Cannot calculate orbit points.`,
      );
      return [];
    }

    const points: OSVector3[] = [];
    const period_s = orbitalParameters.period_s;

    for (let i = 0; i <= segments; i++) {
      // The time represents progress through one full orbit period.
      const timeInOrbit = (i / segments) * period_s;

      // Use the centralized calculator to get the real-world position in meters
      const { position: realRelativePosition } = calculateKeplerianStateAtTime(
        orbitalParameters,
        timeInOrbit,
      );

      // Scale the real position to the scene's rendering scale
      const scaledRelativePosition = realRelativePosition.multiplyScalar(
        SCALE.RENDER_SCALE_AU / AU_METERS,
      );

      points.push(scaledRelativePosition);
    }

    // Ensure the last point connects to the first to close the ellipse,
    // as our loop goes from 0 to segments (inclusive).
    if (points.length > 0) {
      points[points.length - 1] = points[0].clone();
    }

    return points;
  }
}
