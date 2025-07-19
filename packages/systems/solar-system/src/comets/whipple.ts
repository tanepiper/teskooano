import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  METERS_TO_SCENE_UNITS,
  SCALE,
} from "@teskooano/data-types";

// Whipple Comet constants
export const WHIPPLE_NUCLEUS_RADIUS_KM = 2.0; // Estimate
export const WHIPPLE_MASS_KG = 1e13; // Estimate
export const WHIPPLE_ALBEDO = 0.04;
export const WHIPPLE_TEMP_K = 100;
export const WHIPPLE_ACTIVITY = 0.4;
export const WHIPPLE_COMA_RADIUS = 35000 * METERS_TO_SCENE_UNITS * 0.5;
export const WHIPPLE_COMA_COLOR = "#E0FFFF";
export const WHIPPLE_TAIL_LENGTH = 0.06 * SCALE.RENDER_SCALE_AU;
export const WHIPPLE_TAIL_COLOR = "#E0FFFF";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Whipple Comet configuration object for modular solar system initialization.
 */
export const whipple: CelestialObject<CometProperties> = {
  id: "whipple",
  name: "36P/Whipple",
  seed: "whipple",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realRadius_m: kmToM(WHIPPLE_NUCLEUS_RADIUS_KM),
  realMass_kg: WHIPPLE_MASS_KG,
  albedo: WHIPPLE_ALBEDO,
  temperature: WHIPPLE_TEMP_K,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 3.821, // 3.821 AU
    eccentricity: 0.351,
    inclinationDeg: 10.2,
    longitudeOfAscendingNodeDeg: 18.2,
    argumentOfPeriapsisDeg: 188.4,
    meanAnomalyDeg: 0,
    period_s: 2.356e8, // 7.47 years
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTiltDeg: 0, // Comets don't have meaningful axial tilt
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: WHIPPLE_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: WHIPPLE_COMA_RADIUS,
    visualComaColor: WHIPPLE_COMA_COLOR,
    visualMaxTailLength: WHIPPLE_TAIL_LENGTH,
    visualTailColor: WHIPPLE_TAIL_COLOR,
  },
};
