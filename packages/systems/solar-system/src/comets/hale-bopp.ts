import {
  ASTRONOMICAL_EPOCHS,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialObject,
  METERS_TO_SCENE_UNITS,
  SCALE,
} from "@teskooano/data-types";

// Hale-Bopp Comet (C/1995 O1) constants
export const HALEBOPP_NUCLEUS_RADIUS_KM = 30;
export const HALEBOPP_MASS_KG = 2.2e15;
export const HALEBOPP_ALBEDO = 0.04;
export const HALEBOPP_TEMP_K = 100;
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
export const haleBopp: CelestialObject<CometProperties> = {
  id: "hale-bopp",
  name: "C/1995 O1 (Hale-Bopp)",
  seed: "hale_bopp",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realRadius_m: kmToM(HALEBOPP_NUCLEUS_RADIUS_KM),
  realMass_kg: HALEBOPP_MASS_KG,
  albedo: HALEBOPP_ALBEDO,
  temperature: HALEBOPP_TEMP_K,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 177.43, // 177.43 AU
    eccentricity: 0.99498,
    inclinationDeg: 89.287,
    longitudeOfAscendingNodeDeg: 282.73,
    argumentOfPeriapsisDeg: 130.41,
    meanAnomalyDeg: 0,
    period_s: 7.5725e10, // 2399 years
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTiltDeg: 0, // Comets don't have meaningful axial tilt
    epoch: ASTRONOMICAL_EPOCHS.J2000,
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: HALEBOPP_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: HALEBOPP_COMA_RADIUS,
    visualComaColor: HALEBOPP_COMA_COLOR,
    visualMaxTailLength: HALEBOPP_TAIL_LENGTH,
    visualTailColor: HALEBOPP_TAIL_COLOR,
  },
};
