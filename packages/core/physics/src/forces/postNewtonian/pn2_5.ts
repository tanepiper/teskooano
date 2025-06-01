import { OSVector3, EPSILON } from "@teskooano/core-math";
import { PhysicsStateReal } from "../../types";

const SPEED_OF_LIGHT = 299792458;
const C_SQUARED = SPEED_OF_LIGHT * SPEED_OF_LIGHT;
const C_FIFTH = C_SQUARED * C_SQUARED * SPEED_OF_LIGHT; // c^5

/**
 * Calculates the 2.5PN gravitational radiation reaction force acting on body1
 * due to its interaction with body2. This is the Burke-Thorne force.
 * This force leads to the decay of orbits due to gravitational wave emission.
 *
 * Formula from Blanchet, Living Reviews in Relativity (2014), Eq. (205), adapted for force on m1.
 * F_1_RR = (8 * G * m1 * m2) / (15 * c^5 * r^3) *
 *          [ v * (-3*v^2 + (2*G*M/r) + (8*G*m2/r)) +
 *            n * (n . v) * (3*v^2 - (2*G*M/r) - (22*G*m2/r)) ]
 * where M = m1+m2, r = |r1-r2|, n = (r1-r2)/r, v = v1-v2.
 *
 * @param body1 - The physics state of the first body.
 * @param body2 - The physics state of the second body.
 * @param G - The gravitational constant.
 * @returns The 2.5PN radiation reaction force vector acting on body1.
 */
export const calculate2_5PNForce = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G: number,
): OSVector3 => {
  const m1 = body1.mass_kg;
  const m2 = body2.mass_kg;
  const M_total = m1 + m2;

  const r1_vec = body1.position_m;
  const r2_vec = body2.position_m;
  const v1_vec = body1.velocity_mps;
  const v2_vec = body2.velocity_mps;

  const r_vec = OSVector3.subVectors(r1_vec, r2_vec); // r = r1 - r2
  const r_sq = r_vec.lengthSq();

  if (r_sq < EPSILON * EPSILON) {
    return new OSVector3(0, 0, 0);
  }
  const r_len = Math.sqrt(r_sq);
  if (r_len < EPSILON) {
    // Ensure r_len is not too small before division
    return new OSVector3(0, 0, 0);
  }

  const n_vec = OSVector3.multiplyVectorByScalar(r_vec, 1 / r_len);

  const v_vec = OSVector3.subVectors(v1_vec, v2_vec); // v = v1 - v2
  const v_sq = v_vec.lengthSq();
  const n_dot_v = n_vec.dot(v_vec);

  const common_factor = (8 * G * m1 * m2) / (15 * C_FIFTH * r_len * r_sq); // (8 G m1 m2) / (15 c^5 r^3)

  // Term multiplying v_vec
  const term_v_scalar =
    -3 * v_sq + (2 * G * M_total) / r_len + (8 * G * m2) / r_len;
  const force_part1 = OSVector3.multiplyVectorByScalar(v_vec, term_v_scalar);

  // Term multiplying n_vec
  const term_n_scalar_factor = n_dot_v;
  const term_n_scalar_main =
    3 * v_sq - (2 * G * M_total) / r_len - (22 * G * m2) / r_len;
  const force_part2 = OSVector3.multiplyVectorByScalar(
    n_vec,
    term_n_scalar_factor * term_n_scalar_main,
  );

  const total_force = OSVector3.addVectors(force_part1, force_part2);
  total_force.multiplyScalar(common_factor); // Apply the overall common factor

  return total_force;
};
