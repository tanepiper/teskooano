import { CONVERSION } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS, SCALE } from "@teskooano/data-types";

// Halley's Comet (1P/Halley) constants
export const HALLEY_NUCLEUS_RADIUS_M = 5.5 * CONVERSION.KM_TO_M;
export const HALLEY_MASS_KG = 2.2e14;
export const HALLEY_ALBEDO = 0.04;
export const HALLEY_TEMP_K = 100;
export const HALLEY_SMA_M = 2.653e12; // 17.737 AU
export const HALLEY_ECC = 0.96658;
export const HALLEY_INC_RAD = 2.8272; // 161.96 deg
export const HALLEY_LAN_RAD = 1.0367; // 59.396 deg
export const HALLEY_AOP_RAD = 1.9559; // 112.05 deg
export const HALLEY_MA_RAD = 0.001278; // 0.07323 deg
export const HALLEY_PERIOD_S = 2.357e9; // 74.7 years
export const HALLEY_ACTIVITY = 0.7;
export const HALLEY_COMA_RADIUS = 75000 * METERS_TO_SCENE_UNITS * 0.5;
export const HALLEY_COMA_COLOR = "#ADD8E6";
export const HALLEY_TAIL_LENGTH = 0.2 * SCALE.RENDER_SCALE_AU;
export const HALLEY_TAIL_COLOR = "#ADD8E6";

import {
  CelestialType,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

export const halleyComet = {
  id: "halley",
  name: "1P/Halley",
  type: CelestialType.COMET,
  realRadius_m: HALLEY_NUCLEUS_RADIUS_M,
  realMass_kg: HALLEY_MASS_KG,
  albedo: HALLEY_ALBEDO,
  temperature: HALLEY_TEMP_K,
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: HALLEY_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: HALLEY_COMA_RADIUS,
    visualComaColor: HALLEY_COMA_COLOR,
    visualMaxTailLength: HALLEY_TAIL_LENGTH,
    visualTailColor: HALLEY_TAIL_COLOR,
  } as CometProperties,
  orbit: {
    realSemiMajorAxis_m: HALLEY_SMA_M,
    eccentricity: HALLEY_ECC,
    inclination: HALLEY_INC_RAD,
    longitudeOfAscendingNode: HALLEY_LAN_RAD,
    argumentOfPeriapsis: HALLEY_AOP_RAD,
    meanAnomaly: HALLEY_MA_RAD,
    period_s: HALLEY_PERIOD_S,
  },
};
