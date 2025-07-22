import {
  OrbitalParameters,
  GRAVITATIONAL_CONSTANT,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { OSVector3, OSQuaternion } from "@teskooano/core-math";
import { calculateKeplerianStateAtTime as sharedCalculateKeplerianStateAtTime } from "./shared";

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
  // Check for zero parent mass - can't have orbital motion without mass
  if (parentStateReal.mass_kg <= 0) {
    return new OSVector3(0, 0, 0);
  }

  // Validate inputs
  if (Number.isNaN(currentTime)) {
    console.warn("[NBody] Invalid inputs to calculateOrbitalPosition:", {
      orbitalParameters,
      currentTime,
    });
    return new OSVector3(0, 0, 0);
  }

  const { period_s, eccentricity } = orbitalParameters;

  // For n-body mode, we should use numerical integration for ALL orbits
  // including hyperbolic ones. The analytical solution is only used for initial setup.
  // For hyperbolic orbits, we still need to calculate the initial position,
  // but then let the n-body integrator handle the motion.
  if (period_s === 0 && eccentricity > 1) {
    // For hyperbolic orbits, calculate initial position using analytical solution
    // This is only used for initial setup, not for ongoing motion
    const { position } = sharedCalculateKeplerianStateAtTime(
      orbitalParameters,
      currentTime,
      parentStateReal.mass_kg,
    );

    // Validate position to prevent NaN
    if (
      Number.isNaN(position.x) ||
      Number.isNaN(position.y) ||
      Number.isNaN(position.z)
    ) {
      console.error("[NBody] NaN position detected for hyperbolic orbit:", {
        position: position.toArray(),
        orbitalParameters,
        parentMass: parentStateReal.mass_kg,
      });
      return new OSVector3(orbitalParameters.realSemiMajorAxis_m || 0, 0, 0);
    }

    return position;
  }

  // For regular orbits, period must be non-zero
  if (period_s === 0) {
    console.error(
      `[OrbitalCalc Error] period is zero for object orbiting ${parentStateReal.id}! Calculation skipped. Returning zero relative vector.`,
    );
    return new OSVector3(0, 0, 0);
  }

  const { position } = sharedCalculateKeplerianStateAtTime(
    orbitalParameters,
    currentTime,
  );
  return position;
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

  // Validate inputs
  if (Number.isNaN(currentTime)) {
    console.warn("[NBody] Invalid inputs to calculateOrbitalVelocity:", {
      orbitalParameters,
      currentTime,
    });
    return new OSVector3(0, 0, 0);
  }

  const { period_s, eccentricity } = orbitalParameters;

  // Handle hyperbolic orbits (period_s = 0, eccentricity > 1)
  if (period_s === 0 && eccentricity > 1) {
    // For hyperbolic orbits, we need to calculate velocity using hyperbolic equations
    // For hyperbolic orbits, we should NOT add parent velocity since the orbit
    // is calculated relative to the parent's rest frame
    const { velocity } = sharedCalculateKeplerianStateAtTime(
      orbitalParameters,
      currentTime,
      parentStateReal.mass_kg,
    );
    return velocity; // Don't add parent velocity for hyperbolic orbits
  }

  // For regular orbits, period must be non-zero
  if (period_s === 0) {
    console.error(
      `[OrbitalCalc Error] period is zero for object orbiting ${parentStateReal.id}! Calculation skipped. Returning zero velocity vector.`,
    );
    return new OSVector3(0, 0, 0);
  }

  const { velocity } = sharedCalculateKeplerianStateAtTime(
    orbitalParameters,
    currentTime,
  );
  return velocity.add(parentStateReal.velocity_mps);
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
