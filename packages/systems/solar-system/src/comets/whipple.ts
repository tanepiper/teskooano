import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometOrbitType,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Whipple Comet (36P/Whipple)
 *
 * A short-period comet with a period of about 8.5 years.
 * It's a Jupiter-family comet that has been observed since 1922.
 */
export const whipple: CelestialObject = {
  id: "whipple",
  name: "36P/Whipple",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 1e13, // ~10 billion tons
  realRadius_m: 2000, // ~2.0 km nucleus radius
  temperature: 200, // Cold when far from Sun
  orbit: createOrbitalElements({
    semiMajorAxisAU: 4.165,
    eccentricity: 0.2583,
    inclinationDeg: 9.9345,
    longitudeOfAscendingNodeDeg: 18.2,
    argumentOfPeriapsisDeg: 188.4,
    meanAnomalyDeg: 0,
    period_s: 8.5 * 365.25 * 24 * 3600, // 8.5 years
    siderealRotationPeriod_s: 16.8 * 3600, // 16.8 hours
    axialTiltDeg: 0, // Tumbling object
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometOrbitType.SHORT_PERIOD,
    discoveredDate: "1922-01-01",
    composition: ["water ice", "dust"],
    activity: 0.4, // Low activity
    visualComaRadius: 35000, // 35 km coma radius
    visualComaColor: "#E0FFFF",
    visualComaOpacity: 0.4,
    visualMaxTailLength: 800000, // 800,000 km tail
    visualTailColor: "#E0FFFF",
    visualTailOpacity: 0.3,
  } as CometProperties,
};
