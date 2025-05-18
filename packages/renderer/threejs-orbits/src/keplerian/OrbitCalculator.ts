import { AU } from "@teskooano/core-physics";
import type { OrbitalParameters } from "@teskooano/data-types";
import { SCALE } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

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
   * This function solves Kepler's equation iteratively to find the eccentric anomaly
   * and then calculates the position in the orbital plane. It applies rotations based
   * on inclination, longitude of ascending node, and argument of periapsis to obtain
   * the final 3D coordinates.
   *
   * The calculation is performed relative to the central body (focus) assumed to be at the origin (0,0,0).
   * The returned points are scaled from real-world meters to the visual scene units using `SCALE.RENDER_SCALE_AU`.
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
      typeof orbitalParameters.realSemiMajorAxis_m === "undefined"
    ) {
      console.warn(
        "calculateOrbitPoints called without valid orbitalParameters (missing period or realSMA). Returning empty.",
      );

      return [];
    }

    return this.calculateRelativeOrbitPoints(orbitalParameters, segments);
  }

  /**
   * Internal method that performs the actual orbital point calculations.
   *
   * @param orbitalParameters - The Keplerian orbital elements of the object.
   * @param segments - The number of segments to divide the orbit into.
   * @returns An array of `OSVector3` points representing the orbit.
   * @private
   */
  private static calculateRelativeOrbitPoints(
    orbitalParameters: OrbitalParameters,
    segments: number = 256,
  ): OSVector3[] {
    const {
      period_s,
      realSemiMajorAxis_m,
      eccentricity,
      inclination,
      meanAnomaly,
      longitudeOfAscendingNode,
      argumentOfPeriapsis,
    } = orbitalParameters;

    if (period_s === 0 || !realSemiMajorAxis_m || realSemiMajorAxis_m === 0) {
      console.warn(
        `[OrbitCalc] Invalid orbital parameters (period=${period_s}, realSMA=${realSemiMajorAxis_m}). Returning empty points.`,
      );
      return [];
    }

    const points: OSVector3[] = [];
    const meanMotion = (2 * Math.PI) / period_s;

    for (let i = 0; i <= segments; i++) {
      const timeInOrbit = (i / segments) * period_s;
      const currentMeanAnomaly = meanAnomaly + meanMotion * timeInOrbit;

      // Solve Kepler's equation iteratively for eccentric anomaly
      let eccentricAnomaly = currentMeanAnomaly;
      for (let iter = 0; iter < 5; iter++) {
        const delta =
          eccentricAnomaly -
          eccentricity * Math.sin(eccentricAnomaly) -
          currentMeanAnomaly;
        const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
        if (Math.abs(derivative) < 1e-10) {
          break;
        }
        eccentricAnomaly = eccentricAnomaly - delta / derivative;
      }

      // Calculate distance and true anomaly
      const distance_m =
        realSemiMajorAxis_m * (1 - eccentricity * Math.cos(eccentricAnomaly));
      const trueAnomaly =
        2 *
        Math.atan2(
          Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
          Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2),
        );

      // Calculate position in orbital plane
      const xOrbit_m = distance_m * Math.cos(trueAnomaly);
      const yOrbit_m = distance_m * Math.sin(trueAnomaly);

      // Apply argument of periapsis rotation
      const cosArgPeri = Math.cos(argumentOfPeriapsis);
      const sinArgPeri = Math.sin(argumentOfPeriapsis);
      const xPeri_m = xOrbit_m * cosArgPeri - yOrbit_m * sinArgPeri;
      const yPeri_m = xOrbit_m * sinArgPeri + yOrbit_m * cosArgPeri;

      // Apply inclination rotation
      const cosInc = Math.cos(inclination);
      const sinInc = Math.sin(inclination);
      const x_m = xPeri_m;
      const z_intermediate_m = yPeri_m * cosInc;
      const y_intermediate_m = yPeri_m * sinInc;

      // Apply longitude of ascending node rotation
      const cosLon = Math.cos(longitudeOfAscendingNode);
      const sinLon = Math.sin(longitudeOfAscendingNode);
      const xFinal_m = x_m * cosLon - z_intermediate_m * sinLon;
      const zFinal_m = x_m * sinLon + z_intermediate_m * cosLon;
      const yFinal_m = y_intermediate_m;

      // Create the real-unit position vector
      const realRelativePosition = new OSVector3(xFinal_m, yFinal_m, zFinal_m);

      // Scale to scene units
      const scaledRelativePosition = realRelativePosition.multiplyScalar(
        SCALE.RENDER_SCALE_AU / AU,
      );

      points.push(scaledRelativePosition);
    }

    // Connect the last point back to the first to close the ellipse
    if (points.length > 0 && points.length === segments + 1) {
      points[segments] = points[0].clone();
    }

    return points;
  }
}
