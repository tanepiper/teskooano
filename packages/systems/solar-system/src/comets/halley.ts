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

// Halley's Comet (1P/Halley) constants
export const HALLEY_NUCLEUS_RADIUS_KM = 5.5;
export const HALLEY_MASS_KG = 2.2e14;
export const HALLEY_ALBEDO = 0.04;
export const HALLEY_TEMP_K = 100;
export const HALLEY_ACTIVITY = 0.7;
export const HALLEY_COMA_RADIUS = 75000 * METERS_TO_SCENE_UNITS * 0.5;
export const HALLEY_COMA_COLOR = "#ADD8E6";
export const HALLEY_TAIL_LENGTH = 0.2 * SCALE.RENDER_SCALE_AU;
export const HALLEY_TAIL_COLOR = "#ADD8E6";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Halley's Comet configuration object for modular solar system initialization.
 */
export const halley: CelestialObject<CometProperties> = {
  id: "halley",
  name: "1P/Halley",
  seed: "halley",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realRadius_m: kmToM(HALLEY_NUCLEUS_RADIUS_KM),
  realMass_kg: HALLEY_MASS_KG,
  albedo: HALLEY_ALBEDO,
  temperature: HALLEY_TEMP_K,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 17.8, // 17.8 AU (J2000 epoch)
    eccentricity: 0.967, // J2000 epoch
    inclinationDeg: 162.3, // J2000 epoch
    longitudeOfAscendingNodeDeg: 58.42, // J2000 epoch
    argumentOfPeriapsisDeg: 111.33, // J2000 epoch
    meanAnomalyDeg: 38.38, // J2000 epoch
    period_s: 2.357e9, // 74.7 years (J2000 epoch)
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTiltDeg: 0, // Comets don't have meaningful axial tilt
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: HALLEY_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: HALLEY_COMA_RADIUS,
    visualComaColor: HALLEY_COMA_COLOR,
    visualMaxTailLength: HALLEY_TAIL_LENGTH,
    visualTailColor: HALLEY_TAIL_COLOR,
  },
};
