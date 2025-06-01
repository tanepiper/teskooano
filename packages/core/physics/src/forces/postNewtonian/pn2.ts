import { OSVector3, EPSILON } from "@teskooano/core-math";
import { PhysicsStateReal } from "../../types";

const SPEED_OF_LIGHT = 299792458;
const C_SQ = SPEED_OF_LIGHT * SPEED_OF_LIGHT;
const C_FOURTH = C_SQ * C_SQ;

// Fractional coefficients from Blanchet (2014), Eq. (178)
const F_15_2 = 15.0 / 2.0; // 7.5
const F_21_2 = 21.0 / 2.0; // 10.5
const F_15_8 = 15.0 / 8.0; // 1.875
const F_45_4 = 45.0 / 4.0; // 11.25
const F_105_16 = 105.0 / 16.0; // 6.5625
const F_15_4 = 15.0 / 4.0; // 3.75
const F_107_6 = 107.0 / 6.0;
const F_13_2 = 13.0 / 2.0; // 6.5
const F_19_3 = 19.0 / 3.0;
const F_53_3 = 53.0 / 3.0;
const F_103_6 = 103.0 / 6.0;
const F_3_2 = 3.0 / 2.0; // 1.5
const F_13_3 = 13.0 / 3.0;
const F_9_2 = 9.0 / 2.0; // 4.5
const F_121_12 = 121.0 / 12.0;
const F_43_6 = 43.0 / 6.0;
const F_41_16 = 41.0 / 16.0; // 2.5625
const F_61_16 = 61.0 / 16.0; // 3.8125
const F_45_16 = 45.0 / 16.0; // 2.8125
const F_55_12 = 55.0 / 12.0;
const F_21_4 = 21.0 / 4.0; // 5.25 (New - was a typo in usage)
const F_23_3 = 23.0 / 3.0; // (New - was a typo in usage)
const F_13_6 = 13.0 / 6.0; // (New - was a typo in usage)

/**
 * Calculates the 2PN (second-order Post-Newtonian) corrections to the gravitational force
 * acting on body1 due to body2.
 *
 * The formula is based on Blanchet (2014), Living Reviews in Relativity, Eq. (178) for a_1^2PN.
 * The force F_1^2PN = m1 * a_1^2PN.
 *
 * @param body1 - The physics state of the first body.
 * @param body2 - The physics state of the second body.
 * @param G - The gravitational constant.
 * @returns The 2PN corrective force vector acting on body1.
 */
export const calculate2PNForce = (
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

  const r_vec = OSVector3.subVectors(r1_vec, r2_vec);
  const r_sq = r_vec.lengthSq();
  const r_len = Math.sqrt(r_sq);

  if (r_len < EPSILON) {
    return new OSVector3(0, 0, 0);
  }
  const n_vec = OSVector3.multiplyVectorByScalar(r_vec, 1 / r_len);

  const v1_sq = v1_vec.lengthSq();
  const v2_sq = v2_vec.lengthSq();
  const v1_dot_v2 = v1_vec.dot(v2_vec);
  const v1_dot_n = v1_vec.dot(n_vec);
  const v2_dot_n = v2_vec.dot(n_vec);

  // Scalar part A (multiplying n_vec)
  // A = A_v4 + A_GMv2_r + A_G2M2_r2

  // A_v4 terms (velocity-dependent part of A)
  let A_v4 = -2 * v1_sq * v1_sq; // -2 v1^4
  A_v4 -= F_15_2 * v2_sq * v2_sq; // -15/2 v2^4
  A_v4 -= v1_sq * v2_sq; // -v1^2 v2^2
  A_v4 += 4 * v1_dot_v2 * v1_dot_v2; // +4 (v1.v2)^2
  A_v4 += 6 * v1_sq * v1_dot_v2; // +6 v1^2 (v1.v2)
  A_v4 -= F_21_2 * v2_sq * v1_dot_v2; // -21/2 v2^2 (v1.v2)
  A_v4 += F_15_8 * v1_dot_n * v1_dot_n * v2_sq; // +15/8 (v1.n)^2 v2^2
  A_v4 -= F_45_4 * v1_dot_n * v2_dot_n * v2_sq; // -45/4 (v1.n)(v2.n) v2^2
  A_v4 += F_105_16 * v2_dot_n * v2_dot_n * v2_sq; // +105/16 (v2.n)^2 v2^2
  A_v4 += F_15_4 * v1_dot_v2 * v2_dot_n * v2_dot_n; // +15/4 (v1.v2)(v2.n)^2

  // A_GMv2_r terms (G/r * velocity-dependent part of A)
  let A_GMv2_r = (9 * m1 + F_107_6 * m2) * v1_sq; // +(9m1 + 107/6 m2)v1^2
  A_GMv2_r += (F_13_2 * m1 + F_19_3 * m2) * v2_sq; // +(13/2 m1 + 19/3 m2)v2^2
  A_GMv2_r += (F_53_3 * m1 + F_103_6 * m2) * v1_dot_v2; // +(53/3 m1 + 103/6 m2)(v1.v2)
  A_GMv2_r -= F_3_2 * (m1 + F_13_3 * m2) * v1_dot_n * v1_dot_n; // -3/2(m1 + 13/3 m2)(v1.n)^2
  A_GMv2_r -= (F_9_2 * m1 + F_121_12 * m2) * v2_dot_n * v2_dot_n; // -(9/2 m1 + 121/12 m2)(v2.n)^2
  A_GMv2_r -= (F_13_3 * m1 + F_43_6 * m2) * v1_dot_n * v2_dot_n; // -(13/3 m1 + 43/6 m2)(v1.n)(v2.n)
  A_GMv2_r *= G / r_len;

  // A_G2M2_r2 terms ( (G/r)^2 part of A)
  let A_G2M2_r2 = -(2 * m1 * m1 + F_41_16 * m1 * m2 + F_61_16 * m2 * m2); // -(2m1^2 + 41/16 m1m2 + 61/16 m2^2)
  A_G2M2_r2 *= (G * G) / r_sq;

  const A_scalar = A_v4 + A_GMv2_r + A_G2M2_r2;

  // Scalar part B (multiplying (v1_vec - v2_vec))
  // B = B_v3 + B_GMv_r

  // B_v3 terms
  let B1_v3 =
    -2 * v1_sq +
    F_15_4 * v2_sq +
    0.5 * v1_dot_v2 -
    F_45_16 * v2_dot_n * v2_dot_n;
  B1_v3 *= v1_dot_n;
  let B2_v3 =
    -F_3_2 * v1_sq -
    F_13_2 * v2_sq +
    F_21_4 * v1_dot_v2 +
    F_105_16 * v2_dot_n * v2_dot_n;
  B2_v3 *= v2_dot_n;
  const B_v3 = B1_v3 + B2_v3;

  // B_GMv_r terms
  let B_GMv_r = (F_55_12 * m1 + F_23_3 * m2) * v1_dot_n;
  B_GMv_r += (F_13_6 * m1 + F_19_3 * m2) * v2_dot_n;
  B_GMv_r *= G / r_len;

  const B_scalar = B_v3 + B_GMv_r;

  // Components of acceleration a_1^2PN
  const term_A_vec = OSVector3.multiplyVectorByScalar(n_vec, A_scalar);
  const v1_minus_v2 = OSVector3.subVectors(v1_vec, v2_vec);
  const term_B_vec = OSVector3.multiplyVectorByScalar(v1_minus_v2, B_scalar);

  // Prefactor for acceleration: (G * m2) / (r_sq * C_FOURTH)
  const acc_prefactor = (G * m2) / (r_sq * C_FOURTH);

  const acc_2PN = OSVector3.addVectors(term_A_vec, term_B_vec);
  acc_2PN.multiplyScalar(acc_prefactor);

  // Force F_1^2PN = m1 * a_1^2PN
  const force_2PN = OSVector3.multiplyVectorByScalar(acc_2PN, m1);

  return force_2PN;
};
