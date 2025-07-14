import { CONVERSION } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS, SCALE } from "@teskooano/data-types";

// Whipple Comet constants
export const WHIPPLE_NUCLEUS_RADIUS_M = 2.0 * CONVERSION.KM_TO_M; // Estimate
export const WHIPPLE_MASS_KG = 1e13; // Estimate
export const WHIPPLE_ALBEDO = 0.04;
export const WHIPPLE_TEMP_K = 100;
export const WHIPPLE_SMA_M = 5.718e11; // 3.821 AU
export const WHIPPLE_ECC = 0.351;
export const WHIPPLE_INC_RAD = 0.178; // 10.2 deg
export const WHIPPLE_LAN_RAD = 0.318; // 18.2 deg
export const WHIPPLE_AOP_RAD = 3.285; // 188.4 deg
export const WHIPPLE_MA_RAD = 0;
export const WHIPPLE_PERIOD_S = 2.356e8; // 7.47 years
export const WHIPPLE_ACTIVITY = 0.4;
export const WHIPPLE_COMA_RADIUS = 35000 * METERS_TO_SCENE_UNITS * 0.5;
export const WHIPPLE_COMA_COLOR = "#E0FFFF";
export const WHIPPLE_TAIL_LENGTH = 0.06 * SCALE.RENDER_SCALE_AU;
export const WHIPPLE_TAIL_COLOR = "#E0FFFF";

import {
  CelestialType,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

export const whippleComet = {
  id: "whipple",
  name: "36P/Whipple",
  type: CelestialType.COMET,
  realRadius_m: WHIPPLE_NUCLEUS_RADIUS_M,
  realMass_kg: WHIPPLE_MASS_KG,
  albedo: WHIPPLE_ALBEDO,
  temperature: WHIPPLE_TEMP_K,
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: WHIPPLE_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: WHIPPLE_COMA_RADIUS,
    visualComaColor: WHIPPLE_COMA_COLOR,
    visualMaxTailLength: WHIPPLE_TAIL_LENGTH,
    visualTailColor: WHIPPLE_TAIL_COLOR,
  } as CometProperties,
  orbit: {
    realSemiMajorAxis_m: WHIPPLE_SMA_M,
    eccentricity: WHIPPLE_ECC,
    inclination: WHIPPLE_INC_RAD,
    longitudeOfAscendingNode: WHIPPLE_LAN_RAD,
    argumentOfPeriapsis: WHIPPLE_AOP_RAD,
    meanAnomaly: WHIPPLE_MA_RAD,
    period_s: WHIPPLE_PERIOD_S,
  },
};
