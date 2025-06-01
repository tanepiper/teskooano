import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "../../types";
import { calculateNewtonianForce } from "./newtonian";
import { calculate1PNForce } from "./pn1";
import { calculate2PNForce } from "./pn2";
import { calculate2_5PNForce } from "./pn2_5";
import { PNOrder } from "./pn-types";
import {
  calculateRelativisticGravitationalForce,
  calculateRelativisticAcceleration,
} from "../Newtonian/relativistic"; // Updated path

export { PNOrder } from "./pn-types";

/**
 * Calculates the gravitational force between two bodies using the specified Post-Newtonian order.
 *
 * @param body1 - The physics state of the first body.
 * @param body2 - The physics state of the second body.
 * @param G - The gravitational constant.
 * @param order - The desired Post-Newtonian order for the calculation.
 * @returns The calculated gravitational force vector acting on body1.
 */
export const calculateGravitationalForcePN = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G: number,
  order: PNOrder,
): OSVector3 => {
  switch (order) {
    case PNOrder.NEWTONIAN:
      return calculateNewtonianForce(body1, body2, G);

    case PNOrder.SIMPLIFIED_RELATIVISTIC:
      return calculateRelativisticGravitationalForce(body1, body2, G);

    case PNOrder.PN1:
      const newtonianForcePN1 = calculateNewtonianForce(body1, body2, G);
      const pn1Correction = calculate1PNForce(body1, body2, G);
      return newtonianForcePN1.add(pn1Correction);

    case PNOrder.PN2:
      const newtonForcePN2 = calculateNewtonianForce(body1, body2, G);
      const pn1CorrectPN2 = calculate1PNForce(body1, body2, G);
      const pn2Correction = calculate2PNForce(body1, body2, G);
      newtonForcePN2.add(pn1CorrectPN2);
      newtonForcePN2.add(pn2Correction);
      return newtonForcePN2;

    case PNOrder.PN2_5:
      console.warn(
        "PNOrder.PN2_5 currently includes N, 1PN, placeholder 2PN (0), and 2.5PN.",
      );
      const newtonForcePN25 = calculateNewtonianForce(body1, body2, G);
      const pn1CorrectPN25 = calculate1PNForce(body1, body2, G);
      const pn2CorrectPN25 = calculate2PNForce(body1, body2, G);
      const pn25Correction = calculate2_5PNForce(body1, body2, G);
      newtonForcePN25.add(pn1CorrectPN25);
      newtonForcePN25.add(pn2CorrectPN25);
      newtonForcePN25.add(pn25Correction);
      return newtonForcePN25;

    default:
      console.warn(`Unknown PNOrder: ${order}. Defaulting to Newtonian.`);
      return calculateNewtonianForce(body1, body2, G);
  }
};

// TODO: Consider how to handle calculateRelativisticAcceleration in the context of PN orders.
// The PN forces are already "relativistic corrections" to force. The acceleration should then be a = F_total / m (non-relativistic mass)
// or if we want to include relativistic mass effects on acceleration too, it needs careful consideration
// on top of PN forces.
// For now, users of calculateGravitationalForcePN would likely use a = F/m.

export {
  calculateNewtonianForce,
  calculate1PNForce,
  calculate2PNForce,
  calculate2_5PNForce,
  calculateRelativisticGravitationalForce,
  calculateRelativisticAcceleration,
};
