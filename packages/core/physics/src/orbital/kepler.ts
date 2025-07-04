import type { OrbitalParameters } from "@teskooano/data-types";
import { OSQuaternion, OSVector3 } from "@teskooano/core-math";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";

/**
 * Solves Kepler's equation M = E - e * sin(E) for the eccentric anomaly E,
 * given the mean anomaly M and eccentricity e.
 * Uses Newton-Raphson method for iterative solving.
 *
 * @param M Mean anomaly in radians.
 * @param e Eccentricity of the orbit.
 * @param tolerance The desired accuracy for the result.
 * @param maxIterations The maximum number of iterations to prevent infinite loops.
 * @returns The eccentric anomaly E in radians.
 */
export const solveKeplerEquation = (
  M: number,
  e: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100,
): number => {
  // For hyperbolic orbits, a different equation and solver would be needed.
  // This implementation is for elliptical orbits (e < 1).
  let E = M; // Initial guess: for small e, E is close to M.
  for (let i = 0; i < maxIterations; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tolerance) {
      return E;
    }
  }
  // This might happen for highly eccentric orbits.
  // console.warn(`Kepler equation did not converge after ${maxIterations} iterations.`);
  return E; // Return the last approximation.
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
  // To fix retrograde motion, the time evolution is subtracted.
  const meanAnomaly =
    (orbitalParameters.meanAnomaly - meanMotion * time_s) % (2 * Math.PI);
  const eccentricAnomaly = solveKeplerEquation(
    meanAnomaly,
    orbitalParameters.eccentricity,
  );

  // --- 2. Calculate Position in the Orbital Plane (perifocal frame) ---
  const a = orbitalParameters.realSemiMajorAxis_m;
  const e = orbitalParameters.eccentricity;
  const E = eccentricAnomaly;

  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  // The initial orbit is on the XZ plane for a Y-up coordinate system.
  const position = new OSVector3(x, 0, y);

  // --- 3. Calculate Velocity in the Orbital Plane (perifocal frame) ---
  // We need parent mass, but it's not in orbital params. Assume it from period and SMA (Vis-viva).
  // mu = (2*pi/T)^2 * a^3
  const mu =
    Math.pow((2 * Math.PI) / orbitalParameters.period_s, 2) * Math.pow(a, 3);
  let velocity = new OSVector3(0, 0, 0);

  if (mu > 0 && a > 0) {
    const term = Math.sqrt(mu / a) / (1 - e * Math.cos(E));
    const vx = term * -Math.sin(E);
    const vy = term * Math.sqrt(1 - e * e) * Math.cos(E);
    // Velocity must also be on the XZ plane initially.
    velocity.set(vx, 0, vy);
  }

  // --- 4. Rotate Position and Velocity to the Inertial Frame ---
  // The order of rotations is critical: Argument of Periapsis -> Inclination -> Longitude of Ascending Node
  const argP = orbitalParameters.argumentOfPeriapsis;
  const incl = orbitalParameters.inclination;
  const longAscNode = orbitalParameters.longitudeOfAscendingNode;

  // Create rotation quaternions and apply them in order.
  // The argument of periapsis rotates within the orbital plane (now XZ), so its axis is Y.
  const q_argP = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    argP,
  );
  const q_incl = new OSQuaternion().setFromAxisAngle(
    new OSVector3(1, 0, 0),
    incl,
  );
  const q_longAscNode = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    longAscNode,
  );

  const finalRotation = new OSQuaternion()
    .multiply(q_longAscNode)
    .multiply(q_incl)
    .multiply(q_argP);

  position.applyQuaternion(finalRotation);
  velocity.applyQuaternion(finalRotation);

  return { position, velocity };
};
