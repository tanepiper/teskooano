import { createOrbitalElements, kmToM } from "@teskooano/core-physics";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
  type CelestialObject,
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
  parentId: "sun",
  realRadius_m: kmToM(2.0),
  realMass_kg: 1e13,
  albedo: 0.04,
  temperature: 100,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 4.165,
    eccentricity: 0.2583,
    inclinationDeg: 9.9345,
    longitudeOfAscendingNodeDeg: 18.2,
    argumentOfPeriapsisDeg: 188.4,
    meanAnomalyDeg: 0,
    period_s: 268200000,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
    epoch: "JD 2453435.5",
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: 0.4,
    composition: ["water ice", "dust"],
    visualComaRadius: 35000 * 0.5,
    visualComaColor: "#E0FFFF",
    visualMaxTailLength: 0.06,
    visualTailColor: "#E0FFFF",
  },
};
