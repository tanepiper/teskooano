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

// Temple 2 Comet constants
export const TEMPLE2_NUCLEUS_RADIUS_KM = 10.6; // Wikipedia verified: 10.6 km
export const TEMPLE2_MASS_KG = 1e13; // Estimate
export const TEMPLE2_ALBEDO = 0.022; // Wikipedia verified
export const TEMPLE2_TEMP_K = 100;
export const TEMPLE2_ACTIVITY = 0.5;
export const TEMPLE2_COMA_RADIUS = 40000 * METERS_TO_SCENE_UNITS * 0.5;
export const TEMPLE2_COMA_COLOR = "#E6E6FA";
export const TEMPLE2_TAIL_LENGTH = 0.08 * SCALE.RENDER_SCALE_AU;
export const TEMPLE2_TAIL_COLOR = "#E6E6FA";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Temple 2 Comet configuration object for modular solar system initialization.
 */
export const temple2: CelestialObject<CometProperties> = {
  id: "temple-2",
  name: "10P/Tempel 2",
  seed: "temple_2",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realRadius_m: kmToM(TEMPLE2_NUCLEUS_RADIUS_KM),
  realMass_kg: TEMPLE2_MASS_KG,
  albedo: TEMPLE2_ALBEDO,
  temperature: TEMPLE2_TEMP_K,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 3.064, // 3.064 AU (JD 2460800.5 epoch)
    eccentricity: 0.53738,
    inclinationDeg: 12.027,
    longitudeOfAscendingNodeDeg: 117.8,
    argumentOfPeriapsisDeg: 195.5,
    meanAnomalyDeg: 276.53,
    period_s: 169123392, // 5.362 years
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTiltDeg: 0, // Comets don't have meaningful axial tilt
    epoch: "JD 2460800.5",
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: TEMPLE2_ACTIVITY,
    composition: ["water ice", "dust"],
    visualComaRadius: TEMPLE2_COMA_RADIUS,
    visualComaColor: TEMPLE2_COMA_COLOR,
    visualMaxTailLength: TEMPLE2_TAIL_LENGTH,
    visualTailColor: TEMPLE2_TAIL_COLOR,
  },
};
