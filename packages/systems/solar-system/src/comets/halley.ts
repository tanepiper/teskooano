import {
  J2000_EPOCH,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
  type CelestialObject,
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
  parentId: "sun",
  realRadius_m: kmToM(5.5),
  realMass_kg: 2.2e14,
  albedo: 0.04,
  temperature: 100,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 17.8,
    eccentricity: 0.967,
    inclinationDeg: 162.3,
    longitudeOfAscendingNodeDeg: 58.42,
    argumentOfPeriapsisDeg: 111.33,
    meanAnomalyDeg: 38.38,
    period_s: 2.357e9,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: 0.7,
    composition: ["water ice", "dust"],
    visualComaRadius: 75000 * 0.5,
    visualComaColor: "#ADD8E6",
    visualMaxTailLength: 0.2,
    visualTailColor: "#ADD8E6",
  },
};
