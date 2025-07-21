import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  CometClass,
  CelestialObject,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Encke's Comet configuration object for modular solar system initialization.
 */
export const encke: CelestialObject<CometProperties> = {
  id: "encke",
  name: "2P/Encke",
  seed: "encke",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realRadius_m: kmToM(2.4),
  realMass_kg: 2e13,
  albedo: 0.047,
  temperature: 100,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 2.2187,
    eccentricity: 0.8469,
    inclinationDeg: 11.34,
    longitudeOfAscendingNodeDeg: 334.33,
    argumentOfPeriapsisDeg: 187.3,
    meanAnomalyDeg: 0,
    period_s: 1.041e8,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
    epoch: "JD 2460202.5",
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    composition: ["carbon", "dust"],
    activity: 0.4,
    visualComaRadius: 50000 * 0.5,
    visualComaColor: "#F0F8FF",
    visualMaxTailLength: 0.1,
    visualTailColor: "#F0F8FF",
  },
};
