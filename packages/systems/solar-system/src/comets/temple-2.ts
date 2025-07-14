import { CONVERSION } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS, SCALE } from "@teskooano/data-types";

// Temple 2 Comet constants
export const TEMPLE2_NUCLEUS_RADIUS_M = 2.0 * CONVERSION.KM_TO_M; // Estimate
export const TEMPLE2_MASS_KG = 1e13; // Estimate
export const TEMPLE2_ALBEDO = 0.04;
export const TEMPLE2_TEMP_K = 100;
export const TEMPLE2_SMA_M = 4.525e11; // 3.024 AU
export const TEMPLE2_ECC = 0.549;
export const TEMPLE2_INC_RAD = 0.2094; // 12.5 deg
export const TEMPLE2_LAN_RAD = 5.411; // 310.2 deg
export const TEMPLE2_AOP_RAD = 2.082; // 119.3 deg
export const TEMPLE2_MA_RAD = 0;
export const TEMPLE2_PERIOD_S = 1.659e8; // 5.26 years
export const TEMPLE2_ACTIVITY = 0.5;
export const TEMPLE2_COMA_RADIUS = 40000 * METERS_TO_SCENE_UNITS * 0.5;
export const TEMPLE2_COMA_COLOR = "#E6E6FA";
export const TEMPLE2_TAIL_LENGTH = 0.08 * SCALE.RENDER_SCALE_AU;
export const TEMPLE2_TAIL_COLOR = "#E6E6FA";

import {
  CelestialType,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

export const temple2Comet = {
  id: "temple-2",
  name: "10P/Tempel 2",
  type: CelestialType.COMET,
  realRadius_m: TEMPLE2_NUCLEUS_RADIUS_M,
  realMass_kg: TEMPLE2_MASS_KG,
  albedo: TEMPLE2_ALBEDO,
  temperature: TEMPLE2_TEMP_K,
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: TEMPLE2_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: TEMPLE2_COMA_RADIUS,
    visualComaColor: TEMPLE2_COMA_COLOR,
    visualMaxTailLength: TEMPLE2_TAIL_LENGTH,
    visualTailColor: TEMPLE2_TAIL_COLOR,
  } as CometProperties,
  orbit: {
    realSemiMajorAxis_m: TEMPLE2_SMA_M,
    eccentricity: TEMPLE2_ECC,
    inclination: TEMPLE2_INC_RAD,
    longitudeOfAscendingNode: TEMPLE2_LAN_RAD,
    argumentOfPeriapsis: TEMPLE2_AOP_RAD,
    meanAnomaly: TEMPLE2_MA_RAD,
    period_s: TEMPLE2_PERIOD_S,
  },
};
