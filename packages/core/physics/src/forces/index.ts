import { OSVector3 } from "@teskooano/core-math";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-types"; // Import G
import {
  calculateRelativisticGravitationalForce as defaultCalculateGravitationalForce,
  calculateRelativisticAcceleration as defaultCalculateRelativisticAcceleration,
} from "./Newtonian/relativistic";

export * from "./non-gravitational";
export * from "./postNewtonian";
export { calculateGravitationalForcePN } from "./postNewtonian";

export {
  defaultCalculateGravitationalForce,
  defaultCalculateRelativisticAcceleration,
};

import type { PhysicsStateReal } from "../types";
import { calculateGravitationalForcePN, PNOrder } from "./postNewtonian";

/**
 * Calculates the gravitational force between two bodies using the default system
 * (currently the simplified relativistic model from Newtonian/relativistic.ts).
 * For specific Post-Newtonian calculations (including pure Newtonian),
 * use calculateGravitationalForcePN with the desired PNOrder.
 *
 * @param body1 - The physics state of the first body.
 * @param body2 - The physics state of the second body.
 * @param G - Optional. The gravitational constant. Defaults to GRAVITATIONAL_CONSTANT.
 * @returns The gravitational force vector acting on body1.
 */
export const calculateGravitationalForce = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G: number = GRAVITATIONAL_CONSTANT,
): OSVector3 => {
  // Default to the system in Newtonian/relativistic.ts
  // return defaultCalculateGravitationalForce(body1, body2, G);
  /**
   * For now we will stick with PN2 for performance reasons, PN2.5 is more accurate
   * but too slow above 50 bodies.
   */
  return calculateGravitationalForcePN(body1, body2, G, PNOrder.PN2);
};

/**
 * Calculates acceleration from force and mass (a = F/m) using the default model's approach if applicable,
 * or a generic one.
 * Note: The default system has its own calculateRelativisticAcceleration.
 * This is a generic one.
 *
 * @param mass - The mass of the body (kg).
 * @param force - The total force acting on the body (Newtons).
 * @returns The acceleration vector (m/s^2).
 */
export const calculateAcceleration = (
  mass: number,
  force: OSVector3,
): OSVector3 => {
  if (mass === 0) {
    return new OSVector3(0, 0, 0);
  }
  return OSVector3.multiplyVectorByScalar(force, 1 / mass, new OSVector3());
};
