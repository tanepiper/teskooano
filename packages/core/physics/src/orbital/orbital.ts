import { PhysicsStateReal } from "../types"; // Import local type
import {
  OrbitalParameters,
  GRAVITATIONAL_CONSTANT,
} from "@teskooano/data-types"; // Import shared types
import { OSVector3 } from "@teskooano/core-math";

/**
 * Calculates the position of an object based on its orbital parameters around a parent object (REAL units).
 *
 * @param parentStateReal The parent body's REAL physics state (kg, m, m/s)
 * @param orbitalParameters The orbital parameters (needs realSMA_m, period_s, angles in radians)
 * @param currentTime The current simulation time (seconds)
 * @returns The RELATIVE position vector in meters (m)
 */
export const calculateOrbitalPosition = (
  parentStateReal: PhysicsStateReal,
  orbitalParameters: OrbitalParameters,
  currentTime: number
): OSVector3 => {
  const {
    period_s,
    realSemiMajorAxis_m,
    eccentricity,
    inclination,
    meanAnomaly,
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
  } = orbitalParameters;

  // --- Input Validation Logging ---
  if (period_s === 0) {
    console.error(
      `[OrbitalCalc Error] period is zero for object orbiting ${parentStateReal.id}! Calculation skipped. Returning zero relative vector.`
    );
    return new OSVector3(0, 0, 0);
  }
  // REMOVED NaN checks for inputs
  // --- End Input Validation ---

  // Calculate mean anomaly at current time
  const meanMotion = (2 * Math.PI) / period_s;
  const currentMeanAnomaly = meanAnomaly + meanMotion * currentTime;
  // REMOVED NaN check for currentMeanAnomaly

  // Solve Kepler's equation
  let eccentricAnomaly = currentMeanAnomaly;
  for (let i = 0; i < 5; i++) {
    const delta =
      eccentricAnomaly -
      eccentricity * Math.sin(eccentricAnomaly) -
      currentMeanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    if (derivative === 0) {
      console.error(
        "[OrbitalCalc Error] Kepler derivative is zero! Calculation skipped. Returning zero relative vector."
      );
      // Return ZERO relative vector
      return new OSVector3(0, 0, 0);
    }
    eccentricAnomaly = eccentricAnomaly - delta / derivative;
  }
  // REMOVED NaN check for eccentricAnomaly

  // Calculate true anomaly
  const sqrtArg1 = 1 + eccentricity;
  const sqrtArg2 = 1 - eccentricity;
  if (sqrtArg1 < 0 || sqrtArg2 < 0) {
    console.error(
      `[OrbitalCalc Error] Negative value in sqrt for true anomaly! eccentricity=${eccentricity}. Returning zero relative vector.`
    );
    // Return ZERO relative vector
    return new OSVector3(0, 0, 0);
  }
  const term1 = Math.sqrt(sqrtArg1) * Math.sin(eccentricAnomaly / 2);
  const term2 = Math.sqrt(sqrtArg2) * Math.cos(eccentricAnomaly / 2);
  const trueAnomaly = 2 * Math.atan2(term1, term2);
  // REMOVED NaN check for trueAnomaly

  // Calculate distance from focus
  const cosEccAnomaly = Math.cos(eccentricAnomaly);
  const distance = realSemiMajorAxis_m * (1 - eccentricity * cosEccAnomaly);
  // REMOVED NaN check for distance

  // --- Use Standard Transformation Formulas (Y-Up) ---
  const v = trueAnomaly;
  const omega = argumentOfPeriapsis;
  const Omega = longitudeOfAscendingNode;
  const i = inclination;
  const r = distance;

  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosInc = Math.cos(i);
  const sinInc = Math.sin(i);
  const cos_v_omega = Math.cos(v + omega);
  const sin_v_omega = Math.sin(v + omega);

  const xFinal = r * (cosOmega * cos_v_omega - sinOmega * sin_v_omega * cosInc);
  const zFinal = r * (sinOmega * cos_v_omega + cosOmega * sin_v_omega * cosInc); // Y in std frame becomes Z
  const yFinal = r * (sin_v_omega * sinInc); // Z in std frame becomes Y

  const relativePosition = new OSVector3(xFinal, yFinal, zFinal);

  // Return the RELATIVE position (meters)
  return relativePosition;
};

/**
 * Calculates the orbital velocity of an object based on its orbital parameters (REAL units).
 *
 * @param parentStateReal The parent body's REAL physics state (kg, m, m/s)
 * @param orbitalParameters The orbital parameters (needs realSMA_m, period_s, angles in radians)
 * @param currentTime The current simulation time (seconds)
 * @returns The WORLD velocity vector in meters per second (m/s)
 */
export const calculateOrbitalVelocity = (
  parentStateReal: PhysicsStateReal,
  orbitalParameters: OrbitalParameters,
  currentTime: number
): OSVector3 => {
  const {
    period_s,
    realSemiMajorAxis_m,
    eccentricity,
    inclination,
    meanAnomaly,
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
  } = orbitalParameters;

  // Calculate mean anomaly at current time
  const meanMotion = (2 * Math.PI) / period_s;
  const currentMeanAnomaly = meanAnomaly + meanMotion * currentTime;

  // Solve Kepler's equation for eccentric anomaly
  let eccentricAnomaly = currentMeanAnomaly;
  for (let i = 0; i < 5; i++) {
    const delta =
      eccentricAnomaly -
      eccentricity * Math.sin(eccentricAnomaly) -
      currentMeanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    eccentricAnomaly = eccentricAnomaly - delta / derivative;
  }

  // Calculate true anomaly
  const trueAnomaly =
    2 *
    Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    );

  // Calculate standard gravitational parameter (mu) using REAL units
  const mu = GRAVITATIONAL_CONSTANT * parentStateReal.mass_kg;

  // Calculate orbital velocity components in orbital plane (meters/second)
  const p = realSemiMajorAxis_m * (1 - eccentricity * eccentricity);

  // Avoid division by zero if p is zero (e.g., e=1)
  if (p <= 0) {
    console.warn(
      `[OrbitalCalc Velocity] Semi-latus rectum p is zero or negative (p=${p}). Cannot calculate velocity.`
    );
    return new OSVector3(0, 0, 0); // Return zero velocity
  }

  const sqrtMuOverP = Math.sqrt(mu / p);

  // Angles (same as position)
  const v = trueAnomaly;
  const omega = argumentOfPeriapsis;
  const Omega = longitudeOfAscendingNode;
  const i = inclination;

  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosInc = Math.cos(i);
  const sinInc = Math.sin(i);
  const cosArgPeri = Math.cos(omega);
  const sinArgPeri = Math.sin(omega);
  const cos_v_omega = Math.cos(v + omega);
  const sin_v_omega = Math.sin(v + omega);

  // Calculate velocity components using standard formulas
  const vx =
    sqrtMuOverP *
    (-cosOmega * (sin_v_omega + eccentricity * sinArgPeri) -
      sinOmega * (cos_v_omega + eccentricity * cosArgPeri) * cosInc);
  const vz =
    sqrtMuOverP *
    (-sinOmega * (sin_v_omega + eccentricity * sinArgPeri) +
      cosOmega * (cos_v_omega + eccentricity * cosArgPeri) * cosInc); // Y -> Z
  const vy = sqrtMuOverP * ((cos_v_omega + eccentricity * cosArgPeri) * sinInc); // Z -> Y

  const relativeVelocity_mps = new OSVector3(vx, vy, vz);

  // --- FIX: Negate relative velocity to flip orbit direction? ---
  relativeVelocity_mps.multiplyScalar(-1);

  // Return WORLD velocity by adding parent's REAL velocity (m/s)
  return relativeVelocity_mps.add(parentStateReal.velocity_mps);
};

/**
 * @deprecated Use N-body integration instead of direct orbital calculation for updates.
 * Updates a body's state based on its orbital parameters (REAL units).
 */
export const updateOrbitalBody = (
  body: PhysicsStateReal,
  parent: PhysicsStateReal,
  orbitalParameters: OrbitalParameters,
  currentTime: number
): PhysicsStateReal => {
  // Calculate position relative to parent (meters)
  const relative_pos_m = calculateOrbitalPosition(
    parent,
    orbitalParameters,
    currentTime
  );
  // Calculate world velocity (m/s)
  const world_vel_mps = calculateOrbitalVelocity(
    parent,
    orbitalParameters,
    currentTime
  );

  // Use OSVector3 add method for position
  const world_pos_m = relative_pos_m.add(parent.position_m);

  return {
    ...body,
    position_m: world_pos_m,
    velocity_mps: world_vel_mps,
  };
};
