import { createOrbitalElements, kmToM } from "@teskooano/core-physics";

import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CometProperties,
  type CelestialObject,
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
  parentId: "sun",
  realRadius_m: kmToM(10.6),
  realMass_kg: 1e13,
  albedo: 0.022,
  temperature: 100,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 3.064,
    eccentricity: 0.53738,
    inclinationDeg: 12.027,
    longitudeOfAscendingNodeDeg: 117.8,
    argumentOfPeriapsisDeg: 195.5,
    meanAnomalyDeg: 276.53,
    period_s: 169123392,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
    epoch: "JD 2460800.5",
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: 0.5,
    composition: ["water ice", "dust"],
    visualComaRadius: 40000 * 0.5,
    visualComaColor: "#E6E6FA",
    visualMaxTailLength: 0.08,
    visualTailColor: "#E6E6FA",
  },
};
