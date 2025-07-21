import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  CometClass,
  type CelestialObject,
  type CometProperties,
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
  parentId: "sun",
  realRadius_m: kmToM(2.4),
  realMass_kg: 2e13,
  albedo: 0.03,
  temperature: 100,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 3.61,
    eccentricity: 0.6377,
    inclinationDeg: 29.3,
    longitudeOfAscendingNodeDeg: 67.8,
    argumentOfPeriapsisDeg: 75.1,
    meanAnomalyDeg: 0,
    period_s: 216169560,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
    epoch: "JD 2459800.5",
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: 0.6,
    composition: ["water ice", "dust"],
    visualComaRadius: 45000 * 0.5,
    visualComaColor: "#F0F8FF",
    visualMaxTailLength: 0.1,
    visualTailColor: "#F0F8FF",
  },
};
