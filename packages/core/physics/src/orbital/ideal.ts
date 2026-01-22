import { OSQuaternion, OSVector3 } from "@teskooano/core-math";
import { solveKeplerEquation, calculateOrbitalPlaneState } from "./shared";
import { OrbitalParameters } from "@teskooano/data-types";

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

  // 2. Calculate position and velocity in the orbital plane
  // (We only need position, but the shared function returns both)
  const { position } = calculateOrbitalPlaneState(
    orbitalParameters,
    eccentricAnomaly,
  );

  // 3. Rotate position to the inertial frame
  // We use a simplified version of applyOrbitalRotations that only handles position
  const { argumentOfPeriapsis, inclination, longitudeOfAscendingNode } =
    orbitalParameters;

  const q_argPeriapsis = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    argumentOfPeriapsis,
  );
  const q_inclination = new OSQuaternion().setFromAxisAngle(
    new OSVector3(1, 0, 0),
    inclination,
  );
  const q_ascNodeLongitude = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    longitudeOfAscendingNode,
  );

  const finalRotation = new OSQuaternion()
    .multiply(q_ascNodeLongitude)
    .multiply(q_inclination)
    .multiply(q_argPeriapsis);

  position.applyQuaternion(finalRotation);

  return position;
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
  const {
    realSemiMajorAxis_m: semiMajorAxis,
    eccentricity,
    inclination: inclinationAngle,
    longitudeOfAscendingNode: ascNodeLongitude,
    argumentOfPeriapsis: argPeriapsis,
  } = orbitalParameters;

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

  // --- 2. Calculate Position in the Orbital Plane (perifocal frame) ---
  // The initial orbit is on the XZ plane for a Y-up coordinate system.
  // Negate Z to ensure counter-clockwise motion when viewed from +Y
  const position = new OSVector3(
    radius * Math.cos(trueAnomaly_rad),
    0,
    -radius * Math.sin(trueAnomaly_rad),
  );

  // --- 4. Rotate Position to the Inertial Frame ---
  // Replicate the exact same rotation logic as calculateKeplerianStateAtTime
  // The argument of periapsis rotates within the orbital plane (now XZ), so its axis is Y.
  const q_argPeriapsis = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    argPeriapsis,
  );
  const q_inclination = new OSQuaternion().setFromAxisAngle(
    new OSVector3(1, 0, 0),
    inclinationAngle,
  );
  const q_ascNodeLongitude = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    ascNodeLongitude,
  );

  const finalRotation = new OSQuaternion()
    .multiply(q_ascNodeLongitude)
    .multiply(q_inclination)
    .multiply(q_argPeriapsis);

  position.applyQuaternion(finalRotation);

  return position;
};
