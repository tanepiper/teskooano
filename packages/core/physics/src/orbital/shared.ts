import type { OrbitalParameters } from "@teskooano/data-types";
import { OSQuaternion, OSVector3 } from "@teskooano/core-math";

/**
 * Calculate distance-based tolerance for Kepler equation solver
 * @param distanceAU Distance from central body in AU
 * @returns Scaled tolerance value
 */
export function calculateKeplerTolerance(distanceAU: number): number {
  const baseTolerance = 1e-4;
  const scalingFactor = 1e-3;
  const maxTolerance = 1e-2;
  const minTolerance = 1e-5;

  const scaledTolerance = baseTolerance + distanceAU * scalingFactor;
  return Math.max(minTolerance, Math.min(maxTolerance, scaledTolerance));
}

/**
 * Solves Kepler's equation M = E - e * sin(E) for the eccentric anomaly E,
 * given the mean anomaly M and eccentricity e.
 * Uses Newton-Raphson method for iterative solving.
 *
 * @param meanAnomaly Mean anomaly in radians.
 * @param eccentricity Eccentricity of the orbit.
 * @param tolerance The desired accuracy for the result.
 * @param maxIterations The maximum number of iterations to prevent infinite loops.
 * @param distanceAU Optional distance from central body in AU for tolerance scaling.
 * @returns The eccentric anomaly E in radians.
 */
export const solveKeplerEquation = (
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-4,
  maxIterations: number = 100,
  distanceAU?: number,
): number => {
  // Validate inputs
  if (Number.isNaN(meanAnomaly) || Number.isNaN(eccentricity)) {
    console.warn("[Kepler] Invalid inputs to solveKeplerEquation:", {
      meanAnomaly,
      eccentricity,
    });
    return 0;
  }

  // Use distance-based tolerance if distance is provided
  const effectiveTolerance =
    distanceAU !== undefined ? calculateKeplerTolerance(distanceAU) : tolerance;

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
    if (Math.abs(delta) < effectiveTolerance) {
      return eccentricAnomaly;
    }
  }
  // This might happen for highly eccentric orbits.
  // console.warn(`Kepler equation did not converge after ${maxIterations} iterations.`);
  return eccentricAnomaly; // Return the last approximation.
};

/**
 * Applies orbital rotations to position and velocity vectors
 * @param position Position vector in orbital plane
 * @param velocity Velocity vector in orbital plane
 * @param orbitalParameters Orbital parameters containing rotation angles
 * @returns Object with rotated position and velocity
 */
export function applyOrbitalRotations(
  position: OSVector3,
  velocity: OSVector3,
  orbitalParameters: OrbitalParameters,
): { position: OSVector3; velocity: OSVector3 } {
  const { argumentOfPeriapsis, inclination, longitudeOfAscendingNode } =
    orbitalParameters;

  // Apply rotations in correct order: Argument of Periapsis -> Inclination -> Longitude of Ascending Node
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
  velocity.applyQuaternion(finalRotation);

  return { position, velocity };
}

/**
 * Calculates position and velocity in orbital plane (perifocal frame)
 * @param orbitalParameters Orbital parameters
 * @param eccentricAnomaly Eccentric anomaly in radians
 * @returns Object with position and velocity in orbital plane
 */
export function calculateOrbitalPlaneState(
  orbitalParameters: OrbitalParameters,
  eccentricAnomaly: number,
): { position: OSVector3; velocity: OSVector3 } {
  const { realSemiMajorAxis_m: semiMajorAxis, eccentricity } =
    orbitalParameters;

  // Calculate position in orbital plane
  const x = semiMajorAxis * (Math.cos(eccentricAnomaly) - eccentricity);
  const y =
    semiMajorAxis *
    Math.sqrt(1 - eccentricity * eccentricity) *
    Math.sin(eccentricAnomaly);
  // The initial orbit is on the XZ plane for a Y-up coordinate system
  // Negate Z to ensure counter-clockwise motion when viewed from +Y
  const position = new OSVector3(x, 0, -y);

  // Calculate velocity in orbital plane
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
    // Velocity must also be on the XZ plane initially
    // Negate Z component to match position coordinate system
    velocity.set(vx, 0, -vy);
  }

  return { position, velocity };
}

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
  // Validate inputs
  if (Number.isNaN(time_s)) {
    console.warn("[Kepler] Invalid time input:", time_s);
    return {
      position: new OSVector3(0, 0, 0),
      velocity: new OSVector3(0, 0, 0),
    };
  }

  // --- 1. Calculate Mean and Eccentric Anomaly ---
  const meanMotion = (2 * Math.PI) / orbitalParameters.period_s;
  // For prograde motion (normal orbital direction), time evolution is added.
  const meanAnomaly =
    (orbitalParameters.meanAnomaly + meanMotion * time_s) % (2 * Math.PI);
  const eccentricAnomaly = solveKeplerEquation(
    meanAnomaly,
    orbitalParameters.eccentricity,
  );

  // --- 2. Calculate Position and Velocity in the Orbital Plane ---
  const { position, velocity } = calculateOrbitalPlaneState(
    orbitalParameters,
    eccentricAnomaly,
  );

  // --- 3. Rotate Position and Velocity to the Inertial Frame ---
  return applyOrbitalRotations(position, velocity, orbitalParameters);
};
