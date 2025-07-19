import { CONVERSION } from "@teskooano/core-physics";
import { METERS_TO_SCENE_UNITS, SCALE } from "@teskooano/data-types";

// Encke's Comet (2P/Encke) constants
export const ENCKE_NUCLEUS_RADIUS_M = 2.4 * CONVERSION.KM_TO_M;
export const ENCKE_MASS_KG = 2e13;
export const ENCKE_ALBEDO = 0.047;
export const ENCKE_TEMP_K = 100;
export const ENCKE_SMA_M = 3.3197e11; // 2.2187 AU
export const ENCKE_ECC = 0.8469;
export const ENCKE_INC_RAD = 0.1978; // 11.34 deg
export const ENCKE_LAN_RAD = 5.835; // 334.33 deg (not provided in current data)
export const ENCKE_AOP_RAD = 3.2695; // 187.3 deg
export const ENCKE_MA_RAD = 0;
export const ENCKE_PERIOD_S = 1.041e8; // 3.30 years
export const ENCKE_ACTIVITY = 0.4;
export const ENCKE_COMA_RADIUS = 50000 * METERS_TO_SCENE_UNITS * 0.5;
export const ENCKE_COMA_COLOR = "#F0F8FF";
export const ENCKE_TAIL_LENGTH = 0.1 * SCALE.RENDER_SCALE_AU;
export const ENCKE_TAIL_COLOR = "#F0F8FF";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Encke's Comet configuration object for modular solar system initialization.
 */
export const encke = {
  id: "encke",
  name: "2P/Encke",
  seed: "encke",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realRadius_m: ENCKE_NUCLEUS_RADIUS_M,
  realMass_kg: ENCKE_MASS_KG,
  albedo: ENCKE_ALBEDO,
  temperature: ENCKE_TEMP_K,
  orbit: {
    realSemiMajorAxis_m: ENCKE_SMA_M,
    eccentricity: ENCKE_ECC,
    inclination: ENCKE_INC_RAD,
    longitudeOfAscendingNode: ENCKE_LAN_RAD,
    argumentOfPeriapsis: ENCKE_AOP_RAD,
    meanAnomaly: ENCKE_MA_RAD,
    period_s: ENCKE_PERIOD_S,
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTilt: { x: 0, y: 1, z: 0 },
  },
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    composition: ["carbon", "dust"],
    activity: ENCKE_ACTIVITY,
    visualComaRadius: ENCKE_COMA_RADIUS,
    visualComaColor: ENCKE_COMA_COLOR,
    visualMaxTailLength: ENCKE_TAIL_LENGTH,
    visualTailColor: ENCKE_TAIL_COLOR,
  } as CometProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the encke configuration object instead.
 */
export function initializeEncke(parentId: string): void {
  const enckeConfig = { ...encke, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
