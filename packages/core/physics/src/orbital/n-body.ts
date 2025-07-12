import {
  OrbitalParameters,
  GRAVITATIONAL_CONSTANT,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { OSVector3, OSQuaternion } from "@teskooano/core-math";

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
  currentTime: number,
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

  if (period_s === 0) {
    console.error(
      `[OrbitalCalc Error] period is zero for object orbiting ${parentStateReal.id}! Calculation skipped. Returning zero relative vector.`,
    );
    return new OSVector3(0, 0, 0);
  }

  const meanMotion = (2 * Math.PI) / period_s;
  // Use addition for time evolution for prograde motion (normal orbital direction)
  const currentMeanAnomaly = meanAnomaly + meanMotion * currentTime;

  let eccentricAnomaly = currentMeanAnomaly;
  for (let i = 0; i < 5; i++) {
    const delta =
      eccentricAnomaly -
      eccentricity * Math.sin(eccentricAnomaly) -
      currentMeanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    if (derivative === 0) {
      console.error(
        "[OrbitalCalc Error] Kepler derivative is zero! Calculation skipped. Returning zero relative vector.",
      );

      return new OSVector3(0, 0, 0);
    }
    eccentricAnomaly = eccentricAnomaly - delta / derivative;
  }

  const sqrtArg1 = 1 + eccentricity;
  const sqrtArg2 = 1 - eccentricity;
  if (sqrtArg1 < 0 || sqrtArg2 < 0) {
    console.error(
      `[OrbitalCalc Error] Negative value in sqrt for true anomaly! eccentricity=${eccentricity}. Returning zero relative vector.`,
    );

    return new OSVector3(0, 0, 0);
  }
  const term1 = Math.sqrt(sqrtArg1) * Math.sin(eccentricAnomaly / 2);
  const term2 = Math.sqrt(sqrtArg2) * Math.cos(eccentricAnomaly / 2);
  const trueAnomaly = 2 * Math.atan2(term1, term2);

  // Use exact same coordinate system approach as kepler.ts
  // Calculate position in orbital plane using eccentric anomaly (perifocal frame)
  const semiMajorAxis = realSemiMajorAxis_m;
  const ecc = eccentricity;
  const eccAnomaly = eccentricAnomaly;

  const x = semiMajorAxis * (Math.cos(eccAnomaly) - ecc);
  const y = semiMajorAxis * Math.sqrt(1 - ecc * ecc) * Math.sin(eccAnomaly);
  // The initial orbit is on the XZ plane for a Y-up coordinate system (matching kepler.ts)
  // Negate Z to ensure counter-clockwise motion when viewed from +Y
  const position = new OSVector3(x, 0, -y);

  // Apply rotations in same order as kepler.ts: argP -> inclination -> longAscNode
  const argPeriapsis = argumentOfPeriapsis;
  const inclinationAngle = inclination;
  const ascNodeLongitude = longitudeOfAscendingNode;

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
  const relativePosition = position;

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
  currentTime: number,
): OSVector3 => {
  // Check for zero parent mass - can't have orbital motion without mass
  if (parentStateReal.mass_kg <= 0) {
    return new OSVector3(0, 0, 0);
  }

  const {
    period_s,
    realSemiMajorAxis_m,
    eccentricity,
    inclination,
    meanAnomaly,
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
  } = orbitalParameters;

  // Check for zero period
  if (period_s === 0) {
    console.error(
      `[OrbitalCalc Error] period is zero for object orbiting ${parentStateReal.id}! Calculation skipped. Returning zero velocity vector.`,
    );
    return new OSVector3(0, 0, 0);
  }

  const meanMotion = (2 * Math.PI) / period_s;
  // Use addition for time evolution for prograde motion (normal orbital direction)
  const currentMeanAnomaly = meanAnomaly + meanMotion * currentTime;

  let eccentricAnomaly = currentMeanAnomaly;
  for (let i = 0; i < 5; i++) {
    const delta =
      eccentricAnomaly -
      eccentricity * Math.sin(eccentricAnomaly) -
      currentMeanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    if (derivative === 0) {
      console.error(
        "[OrbitalCalc Error] Kepler derivative is zero! Calculation skipped. Returning zero velocity vector.",
      );
      return new OSVector3(0, 0, 0);
    }
    eccentricAnomaly = eccentricAnomaly - delta / derivative;
  }

  // Use exact same velocity calculation approach as kepler.ts
  const semiMajorAxis = realSemiMajorAxis_m;
  const ecc = eccentricity;
  const eccAnomaly = eccentricAnomaly;

  // Calculate mu from period and SMA (same as kepler.ts)
  const mu = Math.pow((2 * Math.PI) / period_s, 2) * Math.pow(semiMajorAxis, 3);

  let velocity = new OSVector3(0, 0, 0);

  if (mu > 0 && semiMajorAxis > 0) {
    const term =
      Math.sqrt(mu / semiMajorAxis) / (1 - ecc * Math.cos(eccAnomaly));
    const vx = term * -Math.sin(eccAnomaly);
    const vy = term * Math.sqrt(1 - ecc * ecc) * Math.cos(eccAnomaly);
    // Velocity must also be on the XZ plane initially (matching kepler.ts)
    // Negate Z component to match position coordinate system
    velocity.set(vx, 0, -vy);
  }

  // Apply rotations in same order as kepler.ts: argP -> inclination -> longAscNode
  const argPeriapsis = argumentOfPeriapsis;
  const inclinationAngle = inclination;
  const ascNodeLongitude = longitudeOfAscendingNode;

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

  velocity.applyQuaternion(finalRotation);
  const relativeVelocity_mps = velocity;

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
  currentTime: number,
): PhysicsStateReal => {
  const relative_pos_m = calculateOrbitalPosition(
    parent,
    orbitalParameters,
    currentTime,
  );

  const world_vel_mps = calculateOrbitalVelocity(
    parent,
    orbitalParameters,
    currentTime,
  );

  const world_pos_m = relative_pos_m.add(parent.position_m);

  return {
    ...body,
    position_m: world_pos_m,
    velocity_mps: world_vel_mps,
  };
};
