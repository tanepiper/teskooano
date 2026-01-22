import type {
  OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { calculateKeplerianStateAtTime } from "../orbital";

/**
 * "Integrator" for perfect, on-rails orbital motion.
 * This does not perform numerical integration. Instead, it calculates the
 * exact position and velocity of a body at a given absolute time based on
 * its Keplerian orbital parameters.
 *
 * @param body The current state of the orbiting body (used as a template for the new state).
 * @param parent The state of the parent body it is orbiting.
 * @param orbitalParameters The Keplerian elements of the orbit.
 * @param currentTime_s The absolute simulation time in seconds.
 * @returns The new, calculated state of the body.
 */
export const idealOrbit = (
  body: PhysicsStateReal,
  parent: PhysicsStateReal,
  orbitalParameters: OrbitalParameters,
  currentTime_s: number,
): PhysicsStateReal => {
  // --- 1. Calculate relative state using the centralized Keplerian solver ---
  const { position, velocity } = calculateKeplerianStateAtTime(
    orbitalParameters,
    currentTime_s,
    parent.mass_kg, // Pass parent mass for proper gravitational parameter calculation
  );

  // --- 2. Add Parent's State for World Coordinates ---
  // This translates the relative orbit into the simulation's absolute space
  position.add(parent.position_m);
  velocity.add(parent.velocity_mps);

  // --- 3. Return the new state ---
  return {
    ...body,
    position_m: position,
    velocity_mps: velocity,
  };
};
