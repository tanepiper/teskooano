import {
  J2000_EPOCH,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialObject,
  METERS_TO_SCENE_UNITS,
  SCALE,
} from "@teskooano/data-types";

// Encke's Comet (2P/Encke) constants
export const ENCKE_NUCLEUS_RADIUS_KM = 2.4;
export const ENCKE_MASS_KG = 2e13;
export const ENCKE_ALBEDO = 0.047;
export const ENCKE_TEMP_K = 100;
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
export const encke: CelestialObject<CometProperties> = {
  id: "encke",
  name: "2P/Encke",
  seed: "encke",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realRadius_m: kmToM(ENCKE_NUCLEUS_RADIUS_KM),
  realMass_kg: ENCKE_MASS_KG,
  albedo: ENCKE_ALBEDO,
  temperature: ENCKE_TEMP_K,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 2.2187, // 2.2187 AU
    eccentricity: 0.8469,
    inclinationDeg: 11.34,
    longitudeOfAscendingNodeDeg: 334.33,
    argumentOfPeriapsisDeg: 187.3,
    meanAnomalyDeg: 0,
    period_s: 1.041e8, // 3.30 years
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTiltDeg: 0, // Comets don't have meaningful axial tilt
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    composition: ["carbon", "dust"],
    activity: ENCKE_ACTIVITY,
    visualComaRadius: ENCKE_COMA_RADIUS,
    visualComaColor: ENCKE_COMA_COLOR,
    visualMaxTailLength: ENCKE_TAIL_LENGTH,
    visualTailColor: ENCKE_TAIL_COLOR,
  },
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
