import { OSVector3, EPSILON } from "@teskooano/core-math";
import { PhysicsStateReal } from "../../types";

const SPEED_OF_LIGHT = 299792458;
const C_SQ = SPEED_OF_LIGHT * SPEED_OF_LIGHT;

/**
 * Calculates the 1PN (first-order Post-Newtonian) corrections to the gravitational force
 * acting on body1 due to body2.
 *
 * These corrections account for lowest-order relativistic effects beyond Newtonian gravity.
 * The formula is derived from the Einstein-Infeld-Hoffmann equations.
 *
 * @param body1 - The physics state of the first body.
 * @param body2 - The physics state of the second body.
 * @param G - The gravitational constant.
 * @returns The 1PN corrective force vector acting on body1.
 */
export const calculate1PNForce = (
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G: number,
): OSVector3 => {
  const m1 = body1.mass_kg;
  const m2 = body2.mass_kg;

  const r1_vec = body1.position_m;
  const r2_vec = body2.position_m;
  const v1_vec = body1.velocity_mps;
  const v2_vec = body2.velocity_mps;

  const r_vec = OSVector3.subVectors(r1_vec, r2_vec); // r_vec points from body2 to body1
  const r_sq = r_vec.lengthSq();
  const r_len = Math.sqrt(r_sq);

  if (r_sq < EPSILON * EPSILON || r_len < EPSILON) {
    return new OSVector3(0, 0, 0);
  }
  const n_vec = OSVector3.multiplyVectorByScalar(r_vec, 1 / r_len); // n_vec is unit vector r_vec/r_len

  const v1_sq = v1_vec.lengthSq();
  const v2_sq = v2_vec.lengthSq();
  const v1_dot_v2 = v1_vec.dot(v2_vec);
  const v1_dot_n = v1_vec.dot(n_vec);
  const v2_dot_n = v2_vec.dot(n_vec);

  const factor = (G * m2) / (r_sq * C_SQ);

  const term_v_sq_part =
    v1_sq + 2 * v2_sq - 4 * v1_dot_v2 - 1.5 * (v2_dot_n * v2_dot_n);
  const term_potential_part = (G / r_len) * (4 * m1 + 5 * m2);

  const bracket_n_scalar = term_v_sq_part - term_potential_part;
  const acc_part1 = OSVector3.multiplyVectorByScalar(n_vec, bracket_n_scalar);

  const v1_minus_v2 = OSVector3.subVectors(v1_vec, v2_vec);
  const bracket_v_diff_scalar = 4 * v1_dot_n - 3 * v2_dot_n;
  const acc_part2 = OSVector3.multiplyVectorByScalar(
    v1_minus_v2,
    bracket_v_diff_scalar,
  );

  const total_1pn_acc_vec = OSVector3.addVectors(acc_part1, acc_part2);
  total_1pn_acc_vec.multiplyScalar(factor); // Multiply in-place as it's the final acc_vec

  // Force on body1
  const total_1pn_force = OSVector3.multiplyVectorByScalar(
    total_1pn_acc_vec,
    m1,
  );

  return total_1pn_force;
};
