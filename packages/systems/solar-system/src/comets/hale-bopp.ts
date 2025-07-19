import { CONVERSION } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS, SCALE } from "@teskooano/data-types";

// Hale-Bopp Comet (C/1995 O1) constants
export const HALEBOPP_NUCLEUS_RADIUS_M = 30 * CONVERSION.KM_TO_M;
export const HALEBOPP_MASS_KG = 2.2e15;
export const HALEBOPP_ALBEDO = 0.04;
export const HALEBOPP_TEMP_K = 100;
export const HALEBOPP_SMA_M = 2.656e13; // 177.43 AU
export const HALEBOPP_ECC = 0.99498;
export const HALEBOPP_INC_RAD = 1.5583; // 89.287 deg
export const HALEBOPP_LAN_RAD = 4.9341; // 282.73 deg
export const HALEBOPP_AOP_RAD = 2.2757; // 130.41 deg
export const HALEBOPP_MA_RAD = 0;
export const HALEBOPP_PERIOD_S = 7.5725e10; // 2399 years
export const HALEBOPP_ACTIVITY = 0.9;
export const HALEBOPP_COMA_RADIUS = 150000 * METERS_TO_SCENE_UNITS * 0.5;
export const HALEBOPP_COMA_COLOR = "#FFFFE0";
export const HALEBOPP_TAIL_LENGTH = 1.0 * SCALE.RENDER_SCALE_AU;
export const HALEBOPP_TAIL_COLOR = "#FFFFE0";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Hale-Bopp Comet configuration object for modular solar system initialization.
 */
export const haleBopp = {
  id: "hale-bopp",
  name: "C/1995 O1 (Hale-Bopp)",
  seed: "hale_bopp",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realRadius_m: HALEBOPP_NUCLEUS_RADIUS_M,
  realMass_kg: HALEBOPP_MASS_KG,
  albedo: HALEBOPP_ALBEDO,
  temperature: HALEBOPP_TEMP_K,
  orbit: {
    realSemiMajorAxis_m: HALEBOPP_SMA_M,
    eccentricity: HALEBOPP_ECC,
    inclination: HALEBOPP_INC_RAD,
    longitudeOfAscendingNode: HALEBOPP_LAN_RAD,
    argumentOfPeriapsis: HALEBOPP_AOP_RAD,
    meanAnomaly: HALEBOPP_MA_RAD,
    period_s: HALEBOPP_PERIOD_S,
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTilt: { x: 0, y: 1, z: 0 },
  },
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: HALEBOPP_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: HALEBOPP_COMA_RADIUS,
    visualComaColor: HALEBOPP_COMA_COLOR,
    visualMaxTailLength: HALEBOPP_TAIL_LENGTH,
    visualTailColor: HALEBOPP_TAIL_COLOR,
  } as CometProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the haleBopp configuration object instead.
 */
export function initializeHaleBopp(parentId: string): void {
  const haleBoppConfig = { ...haleBopp, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
