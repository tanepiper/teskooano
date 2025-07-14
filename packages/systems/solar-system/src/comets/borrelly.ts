import { CONVERSION } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS, SCALE } from "@teskooano/data-types";

// Borrelly Comet constants
export const BORRELLY_NUCLEUS_RADIUS_M = 2.0 * CONVERSION.KM_TO_M; // Estimate
export const BORRELLY_MASS_KG = 1e13; // Estimate
export const BORRELLY_ALBEDO = 0.04;
export const BORRELLY_TEMP_K = 100;
export const BORRELLY_SMA_M = 5.35e11; // 3.576 AU
export const BORRELLY_ECC = 0.632;
export const BORRELLY_INC_RAD = 0.527; // 30.2 deg
export const BORRELLY_LAN_RAD = 1.183; // 67.8 deg
export const BORRELLY_AOP_RAD = 1.311; // 75.1 deg
export const BORRELLY_MA_RAD = 0;
export const BORRELLY_PERIOD_S = 2.133e8; // 6.76 years
export const BORRELLY_ACTIVITY = 0.6;
export const BORRELLY_COMA_RADIUS = 45000 * METERS_TO_SCENE_UNITS * 0.5;
export const BORRELLY_COMA_COLOR = "#F0F8FF";
export const BORRELLY_TAIL_LENGTH = 0.1 * SCALE.RENDER_SCALE_AU;
export const BORRELLY_TAIL_COLOR = "#F0F8FF";

import {
  CelestialType,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

export const borrellyComet = {
  id: "borrelly",
  name: "19P/Borrelly",
  type: CelestialType.COMET,
  realRadius_m: BORRELLY_NUCLEUS_RADIUS_M,
  realMass_kg: BORRELLY_MASS_KG,
  albedo: BORRELLY_ALBEDO,
  temperature: BORRELLY_TEMP_K,
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: BORRELLY_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: BORRELLY_COMA_RADIUS,
    visualComaColor: BORRELLY_COMA_COLOR,
    visualMaxTailLength: BORRELLY_TAIL_LENGTH,
    visualTailColor: BORRELLY_TAIL_COLOR,
  } as CometProperties,
  orbit: {
    realSemiMajorAxis_m: BORRELLY_SMA_M,
    eccentricity: BORRELLY_ECC,
    inclination: BORRELLY_INC_RAD,
    longitudeOfAscendingNode: BORRELLY_LAN_RAD,
    argumentOfPeriapsis: BORRELLY_AOP_RAD,
    meanAnomaly: BORRELLY_MA_RAD,
    period_s: BORRELLY_PERIOD_S,
  },
};
