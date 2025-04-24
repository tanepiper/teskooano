import { AU } from "@teskooano/core-physics";
import type { OrbitalParameters } from "@teskooano/data-types";
import { SCALE } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

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
 * @returns An array of `THREE.Vector3` points representing the orbit in scaled visual units, relative to the focus at (0,0,0). Returns an empty array if essential parameters (period, semi-major axis) are invalid.
 * @internal This function calculates the raw relative points and is typically called by `calculateOrbitPoints`.
 */
export function calculateRelativeOrbitPoints(
  orbitalParameters: OrbitalParameters,
  segments: number = 256,
): OSVector3[] {
  const {
    period_s,
    realSemiMajorAxis_m,
    eccentricity,
    inclination,
    meanAnomaly, // Base anomaly at epoch
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
  } = orbitalParameters;

  // Basic validation using real SMA
  if (period_s === 0 || !realSemiMajorAxis_m || realSemiMajorAxis_m === 0) {
    console.warn(
      `[OrbitCalc Rel] Invalid orbital parameters (period=${period_s}, realSMA=${realSemiMajorAxis_m}). Returning empty points.`,
    );
    return [];
  }

  const points: OSVector3[] = [];
  const meanMotion = (2 * Math.PI) / period_s;

  for (let i = 0; i <= segments; i++) {
    const timeInOrbit = (i / segments) * period_s;
    const currentMeanAnomaly = meanAnomaly + meanMotion * timeInOrbit;

    // --- Kepler solver ---
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

    // Calculate distance (using REAL SMA) and true anomaly
    const distance_m =
      realSemiMajorAxis_m * (1 - eccentricity * Math.cos(eccentricAnomaly));
    const trueAnomaly =
      2 *
      Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2),
      );

    // --- Position in orbital plane (relative to focus at origin) in REAL meters ---
    const xOrbit_m = distance_m * Math.cos(trueAnomaly);
    const yOrbit_m = distance_m * Math.sin(trueAnomaly);

    // --- Rotations (matching core-physics logic structure) ---
    const cosArgPeri = Math.cos(argumentOfPeriapsis);
    const sinArgPeri = Math.sin(argumentOfPeriapsis);
    const xPeri_m = xOrbit_m * cosArgPeri - yOrbit_m * sinArgPeri;
    const yPeri_m = xOrbit_m * sinArgPeri + yOrbit_m * cosArgPeri;

    const cosInc = Math.cos(inclination);
    const sinInc = Math.sin(inclination);
    const x_m = xPeri_m;
    const z_intermediate_m = yPeri_m * cosInc;
    const y_intermediate_m = yPeri_m * sinInc;

    const cosLon = Math.cos(longitudeOfAscendingNode);
    const sinLon = Math.sin(longitudeOfAscendingNode);
    const xFinal_m = x_m * cosLon - z_intermediate_m * sinLon;
    const zFinal_m = x_m * sinLon + z_intermediate_m * cosLon;
    const yFinal_m = y_intermediate_m;

    // Create REAL RELATIVE position vector (relative to parent focus)
    const realRelativePosition = new OSVector3(xFinal_m, yFinal_m, zFinal_m);

    // Scale the REAL RELATIVE position to Scene Units (meters -> scene units)
    const scaledRelativePosition = realRelativePosition.multiplyScalar(
      SCALE.RENDER_SCALE_AU / AU,
    );

    // Push the SCALED RELATIVE position
    points.push(scaledRelativePosition);
  }

  // Ensure the orbit is closed
  if (points.length > 0 && points.length === segments + 1) {
    // Ensure the last point matches the first SCALED point
    points[segments] = points[0].clone();
  }

  return points;
}

/**
 * Calculates the appropriate points for rendering a static Keplerian orbit line.
 *
 * This function serves as the main entry point for calculating orbit points for visualization.
 * It validates the essential orbital parameters (`period_s`, `realSemiMajorAxis_m`)
 * and then calls `calculateRelativeOrbitPoints` to perform the detailed calculation.
 *
 * The returned points define the shape of the orbit relative to its parent's position
 * and are scaled for visual rendering.
 *
 * @param orbitalParameters - The Keplerian orbital elements of the object.
 * @param segments - The number of segments to divide the orbit into for visualization. Defaults to 256.
 * @returns An array of `THREE.Vector3` points representing the orbit in scaled visual units, relative to the focus. Returns an empty array if essential parameters are missing or invalid.
 */
export function calculateOrbitPoints(
  orbitalParameters: OrbitalParameters,
  segments: number = 256,
): OSVector3[] {
  // Always calculate the static relative orbit shape using physics parameters
  // Ensure orbitalParameters are valid before calling
  if (
    !orbitalParameters ||
    typeof orbitalParameters.period_s === "undefined" ||
    typeof orbitalParameters.realSemiMajorAxis_m === "undefined"
  ) {
    console.warn(
      "calculateOrbitPoints called without valid orbitalParameters (missing period or realSMA). Returning empty.",
    );
    // Return empty array if essential physics parameters are missing
    return [];
  }

  // Directly call the main relative calculation function
  return calculateRelativeOrbitPoints(orbitalParameters, segments);
}
