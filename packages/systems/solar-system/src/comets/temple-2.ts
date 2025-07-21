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

// Temple 2 Comet constants
export const TEMPLE2_NUCLEUS_RADIUS_KM = 2.0; // Estimate
export const TEMPLE2_MASS_KG = 1e13; // Estimate
export const TEMPLE2_ALBEDO = 0.04;
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
    semiMajorAxisAU: 3.024, // 3.024 AU
    eccentricity: 0.549,
    inclinationDeg: 12.5,
    longitudeOfAscendingNodeDeg: 310.2,
    argumentOfPeriapsisDeg: 119.3,
    meanAnomalyDeg: 0,
    period_s: 1.659e8, // 5.26 years
    siderealRotationPeriod_s: 0, // Comets don't have meaningful rotation periods
    axialTiltDeg: 0, // Comets don't have meaningful axial tilt
    epoch: ASTRONOMICAL_EPOCHS.J2000,
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
