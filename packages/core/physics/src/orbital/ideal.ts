import type { OrbitalParameters } from "@teskooano/data-types";
import { OSQuaternion, OSVector3 } from "@teskooano/core-math";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";

/**
 * Solves Kepler's equation M = E - e * sin(E) for the eccentric anomaly E,
 * given the mean anomaly M and eccentricity e.
 * Uses Newton-Raphson method for iterative solving.
 *
 * @param meanAnomaly Mean anomaly in radians.
 * @param eccentricity Eccentricity of the orbit.
 * @param tolerance The desired accuracy for the result.
 * @param maxIterations The maximum number of iterations to prevent infinite loops.
 * @returns The eccentric anomaly E in radians.
 */
export const solveKeplerEquation = (
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100,
): number => {
  // For hyperbolic orbits, a different equation and solver would be needed.
  // This implementation is for elliptical orbits (e < 1).
  let eccentricAnomaly = meanAnomaly; // Initial guess: for small eccentricity, eccentricAnomaly is close to meanAnomaly.
  for (let i = 0; i < maxIterations; i++) {
    const delta =
      (eccentricAnomaly -
        eccentricity * Math.sin(eccentricAnomaly) -
        meanAnomaly) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly -= delta;
    if (Math.abs(delta) < tolerance) {
      return eccentricAnomaly;
    }
  }
  // This might happen for highly eccentric orbits.
  // console.warn(`Kepler equation did not converge after ${maxIterations} iterations.`);
  return eccentricAnomaly; // Return the last approximation.
};

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
  // --- 1. Calculate Mean and Eccentric Anomaly ---
  const meanMotion = (2 * Math.PI) / orbitalParameters.period_s;
  // For prograde motion (normal orbital direction), time evolution is added.
  const meanAnomaly =
    (orbitalParameters.meanAnomaly + meanMotion * time_s) % (2 * Math.PI);
  const eccentricAnomaly = solveKeplerEquation(
    meanAnomaly,
    orbitalParameters.eccentricity,
  );

  // --- 2. Calculate Position in the Orbital Plane (perifocal frame) ---
  const semiMajorAxis = orbitalParameters.realSemiMajorAxis_m;
  const eccentricity = orbitalParameters.eccentricity;

  const x = semiMajorAxis * (Math.cos(eccentricAnomaly) - eccentricity);
  const y =
    semiMajorAxis *
    Math.sqrt(1 - eccentricity * eccentricity) *
    Math.sin(eccentricAnomaly);
  // The initial orbit is on the XZ plane for a Y-up coordinate system.
  // Negate Z (y in orbital plane) to ensure counter-clockwise motion when viewed from +Y
  const position = new OSVector3(x, 0, -y);

  // --- 3. Calculate Velocity in the Orbital Plane (perifocal frame) ---
  // We need parent mass, but it's not in orbital params. Assume it from period and SMA (Vis-viva).
  // mu = (2*pi/T)^2 * a^3
  const mu =
    Math.pow((2 * Math.PI) / orbitalParameters.period_s, 2) *
    Math.pow(semiMajorAxis, 3);
  let velocity = new OSVector3(0, 0, 0);

  if (mu > 0 && semiMajorAxis > 0) {
    const term =
      Math.sqrt(mu / semiMajorAxis) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
    const vx = term * -Math.sin(eccentricAnomaly);
    const vy =
      term *
      Math.sqrt(1 - eccentricity * eccentricity) *
      Math.cos(eccentricAnomaly);
    // Velocity must also be on the XZ plane initially.
    // Negate Z component to match position coordinate system
    velocity.set(vx, 0, -vy);
  }

  // --- 4. Rotate Position and Velocity to the Inertial Frame ---
  // The order of rotations is critical: Argument of Periapsis -> Inclination -> Longitude of Ascending Node
  const argPeriapsis = orbitalParameters.argumentOfPeriapsis;
  const inclinationAngle = orbitalParameters.inclination;
  const ascNodeLongitude = orbitalParameters.longitudeOfAscendingNode;

  // Create rotation quaternions and apply them in order.
  // The argument of periapsis rotates within the orbital plane (now XZ), so its axis is Y.
  const q_argPeriapsis = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    argPeriapsis,
  );

  // The inclination rotates around the X axis (line of nodes)
  const q_inclination = new OSQuaternion().setFromAxisAngle(
    new OSVector3(1, 0, 0),
    inclinationAngle,
  );

  // The longitude of ascending node rotates around the Y axis
  const q_ascNodeLongitude = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    ascNodeLongitude,
  );

  // Apply rotations in correct order
  const finalRotation = new OSQuaternion()
    .multiply(q_ascNodeLongitude)
    .multiply(q_inclination)
    .multiply(q_argPeriapsis);

  position.applyQuaternion(finalRotation);
  velocity.applyQuaternion(finalRotation);

  return { position, velocity };
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
