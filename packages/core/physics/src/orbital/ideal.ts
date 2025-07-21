import type { OrbitalParameters } from "@teskooano/data-types";
import { OSQuaternion, OSVector3 } from "@teskooano/core-math";
import { calculateKeplerianStateAtTime as sharedCalculateKeplerianStateAtTime } from "./shared";

/**
 * Calculates the exact relative position and velocity of a body at a given time
 * based on its Keplerian orbital parameters.
 *
 * @param orbitalParameters The Keplerian elements of the orbit.
 * @param time_s The time in seconds for which to calculate the state.
 * @returns The calculated relative state of the body (position in meters, velocity in m/s).
 */
export const calculateKeplerianStateAtTime = (
  orbitalParameters: OrbitalParameters,
  time_s: number,
): { position: OSVector3; velocity: OSVector3 } => {
  return sharedCalculateKeplerianStateAtTime(orbitalParameters, time_s);
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

  // Calculate the distance from the central body (radius) using the polar equation for an ellipse
  const radius =
    (semiMajorAxis * (1 - eccentricity * eccentricity)) /
    (1 + eccentricity * Math.cos(trueAnomaly_rad));

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
