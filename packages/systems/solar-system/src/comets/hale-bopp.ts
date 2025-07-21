import { createOrbitalElements, kmToM } from "@teskooano/core-physics";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
  type CelestialObject,
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
  parentId: "sun",
  realRadius_m: kmToM(30),
  realMass_kg: 2.2e15,
  albedo: 0.04,
  temperature: 100,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 177.43,
    eccentricity: 0.99498,
    inclinationDeg: 89.287,
    longitudeOfAscendingNodeDeg: 282.73,
    argumentOfPeriapsisDeg: 130.41,
    meanAnomalyDeg: 0,
    period_s: 7.5725e10,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
    epoch: "JD 2459837.5",
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: 0.9,
    composition: ["water ice", "dust"],
    visualComaRadius: 150000 * 0.5,
    visualComaColor: "#FFFFE0",
    visualMaxTailLength: 1.0,
    visualTailColor: "#FFFFE0",
  },
};
