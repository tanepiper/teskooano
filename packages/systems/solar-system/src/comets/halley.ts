import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometOrbitType,
  type CometProperties,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Halley's Comet (1P/Halley)
 *
 * One of the most famous comets, with a period of about 76 years.
 * It's a long-period comet that has been observed for over 2000 years.
 */
export const halley: CelestialObject = {
  id: "halley",
  name: "Halley's Comet",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 2.2e14, // ~220 billion tons
  realRadius_m: 5500, // ~5.5 km nucleus radius
  temperature: 200, // Cold when far from Sun
  orbit: createOrbitalElements({
    semiMajorAxisAU: 17.834,
    eccentricity: 0.967,
    inclinationDeg: 162.26,
    longitudeOfAscendingNodeDeg: 58.42,
    argumentOfPeriapsisDeg: 111.33,
    meanAnomalyDeg: 38.38,
    period_s: 76.1 * 365.25 * 24 * 3600, // 76.1 years
    siderealRotationPeriod_s: 52.8 * 3600, // 52.8 hours
    axialTiltDeg: 0, // Tumbling object
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometOrbitType.LONG_PERIOD,
    composition: ["water ice", "CO2", "methane", "ammonia"],
    activity: 0.8, // Active when near perihelion
    visualComaRadius: 100000, // 100 km coma radius
    visualComaColor: "#87CEEB",
    visualComaOpacity: 0.7,
    visualMaxTailLength: 10000000, // 10 million km tail
    visualTailColor: "#DCE6FF",
    visualTailOpacity: 0.6,
  } as CometProperties,
};
