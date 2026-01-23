import { OSVector3 } from "@teskooano/core-math";
import type { OrbitalParameters } from "@teskooano/data-types";
import {
  solveKeplerEquation,
  calculateOrbitalPlaneState,
  applyOrbitalRotationToPosition,
} from "./shared";

/**
 * Calculates the 3D position of an orbiting body at a specific mean anomaly.
 * This is useful for sampling orbits at equal time intervals, which is essential
 * for smooth trail rendering.
 *
 * @param orbitalParameters The Keplerian orbital elements of the object.
 * @param meanAnomaly_rad The mean anomaly in radians.
 * @returns The calculated 3D position vector in meters, relative to the central body.
 */
export const calculateKeplerianPositionAtMeanAnomaly = (
  orbitalParameters: OrbitalParameters,
  meanAnomaly_rad: number,
): OSVector3 => {
  const { eccentricity } = orbitalParameters;

  // 1. Solve Kepler's equation for the eccentric anomaly E
  const eccentricAnomaly = solveKeplerEquation(meanAnomaly_rad, eccentricity);

  // 2. Calculate position in the orbital plane
  const { position } = calculateOrbitalPlaneState(
    orbitalParameters,
    eccentricAnomaly,
  );

  // 3. Rotate position to the inertial frame
  return applyOrbitalRotationToPosition(position, orbitalParameters);
};

/**
 * Calculates the 3D position of an orbiting body at a specific true anomaly.
 * This is useful for drawing the geometric shape of the orbit without regard to time.
 *
 * @param orbitalParameters The Keplerian orbital elements of the object.
 * @param trueAnomaly_rad The true anomaly (angle from periapsis) in radians.
 * @returns The calculated 3D position vector in meters, relative to the central body.
 */
export const calculateKeplerianPositionAtTrueAnomaly = (
  orbitalParameters: OrbitalParameters,
  trueAnomaly_rad: number,
): OSVector3 => {
  const { realSemiMajorAxis_m: semiMajorAxis, eccentricity } =
    orbitalParameters;

  // Calculate the distance from the central body (radius) using the polar equation
  let radius: number;
  if (eccentricity < 1) {
    // Elliptical orbit
    radius =
      (semiMajorAxis * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(trueAnomaly_rad));
  } else if (eccentricity > 1) {
    // Hyperbolic orbit
    radius =
      (Math.abs(semiMajorAxis) * (eccentricity * eccentricity - 1)) /
      (1 + eccentricity * Math.cos(trueAnomaly_rad));
  } else {
    // Parabolic orbit (eccentricity = 1)
    radius = (semiMajorAxis * 2) / (1 + Math.cos(trueAnomaly_rad));
  }

  // Calculate position in the orbital plane (perifocal frame)
  // XZ plane for Y-up coordinate system, negate Z for counter-clockwise motion
  const position = new OSVector3(
    radius * Math.cos(trueAnomaly_rad),
    0,
    -radius * Math.sin(trueAnomaly_rad),
  );

  // Rotate position to the inertial frame
  return applyOrbitalRotationToPosition(position, orbitalParameters);
};
