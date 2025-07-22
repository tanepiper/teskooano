import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometOrbitType,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Hale-Bopp Comet (C/1995 O1)
 *
 * One of the most spectacular comets of the 20th century.
 * It's a long-period comet with a period of about 2,500 years.
 * It was visible to the naked eye for 18 months in 1996-1997.
 */
export const haleBopp: CelestialObject = {
  id: "hale-bopp",
  name: "C/1995 O1 (Hale-Bopp)",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 2.2e15, // ~2.2 trillion tons
  realRadius_m: 30000, // ~30 km nucleus radius
  temperature: 150, // Cold when far from Sun
  orbit: createOrbitalElements({
    semiMajorAxisAU: 177.43,
    eccentricity: 0.99498,
    inclinationDeg: 89.287,
    longitudeOfAscendingNodeDeg: 282.73,
    argumentOfPeriapsisDeg: 130.41,
    meanAnomalyDeg: 0,
    period_s: 2500 * 365.25 * 24 * 3600, // ~2,500 years
    siderealRotationPeriod_s: 11.4 * 3600, // 11.4 hours
    axialTiltDeg: 0, // Tumbling object
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometOrbitType.LONG_PERIOD,
    discoveredDate: "1995-03-23",
    composition: ["water ice", "dust", "CO2"],
    activity: 0.9, // Very active
    visualComaRadius: 150000, // 150 km coma radius
    visualComaColor: "#FFFFE0",
    visualComaOpacity: 0.8,
    visualMaxTailLength: 15000000, // 15 million km tail
    visualTailColor: "#FFFFE0",
    visualTailOpacity: 0.7,
  } as CometProperties,
};
