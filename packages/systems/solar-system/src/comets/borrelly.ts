import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  METERS_TO_SCENE_UNITS,
  SCALE,
  type CometProperties,
} from "@teskooano/data-types";

// Borrelly Comet constants
export const BORRELLY_NUCLEUS_RADIUS_KM = 2.0; // Estimate
export const BORRELLY_MASS_KG = 1e13; // Estimate
export const BORRELLY_ALBEDO = 0.04;
export const BORRELLY_TEMP_K = 100;
export const BORRELLY_ACTIVITY = 0.6;
export const BORRELLY_COMA_RADIUS = 45000 * METERS_TO_SCENE_UNITS * 0.5;
export const BORRELLY_COMA_COLOR = "#F0F8FF";
export const BORRELLY_TAIL_LENGTH = 0.1 * SCALE.RENDER_SCALE_AU;
export const BORRELLY_TAIL_COLOR = "#F0F8FF";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
} from "@teskooano/data-types";

/**
 * Borrelly Comet configuration object for modular solar system initialization.
 */
export const borrelly: CelestialObject<CometProperties> = {
  id: "borrelly",
  name: "19P/Borrelly",
  seed: "borrelly",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realRadius_m: kmToM(BORRELLY_NUCLEUS_RADIUS_KM),
  realMass_kg: BORRELLY_MASS_KG,
  albedo: BORRELLY_ALBEDO,
  temperature: BORRELLY_TEMP_K,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 3.576, // 3.576 AU
    eccentricity: 0.632,
    inclinationDeg: 30.2,
    longitudeOfAscendingNodeDeg: 67.8,
    argumentOfPeriapsisDeg: 75.1,
    meanAnomalyDeg: 0,
    period_s: 2.133e8, // 6.76 years
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTiltDeg: 0, // Comets don't have meaningful axial tilt
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: BORRELLY_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: BORRELLY_COMA_RADIUS,
    visualComaColor: BORRELLY_COMA_COLOR,
    visualMaxTailLength: BORRELLY_TAIL_LENGTH,
    visualTailColor: BORRELLY_TAIL_COLOR,
  },
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the borrelly configuration object instead.
 */
export function initializeBorrelly(parentId: string): void {
  const borrellyConfig = { ...borrelly, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
