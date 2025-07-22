import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometOrbitType,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Borrelly's Comet (19P/Borrelly)
 *
 * A short-period comet with a period of about 6.8 years.
 * It's a Jupiter-family comet that has been extensively studied by spacecraft.
 */
export const borrelly: CelestialObject<CometProperties> = {
  id: "borrelly",
  name: "19P/Borrelly",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 2e13, // ~20 billion tons
  realRadius_m: 2400, // ~2.4 km nucleus radius
  temperature: 200, // Cold when far from Sun
  orbit: createOrbitalElements({
    semiMajorAxisAU: 3.61,
    eccentricity: 0.6377,
    inclinationDeg: 29.3,
    longitudeOfAscendingNodeDeg: 67.8,
    argumentOfPeriapsisDeg: 75.1,
    meanAnomalyDeg: 0,
    period_s: 6.8 * 365.25 * 24 * 3600, // 6.8 years
    siderealRotationPeriod_s: 25.0 * 3600, // 25 hours
    axialTiltDeg: 0, // Tumbling object
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometOrbitType.SHORT_PERIOD,
    discoveredDate: "1892-03-12",
    composition: ["water ice", "dust"],
    activity: 0.6, // Moderate activity
    visualComaRadius: 45000, // 45 km coma radius
    visualComaColor: "#F0F8FF",
    visualComaOpacity: 0.6,
    visualMaxTailLength: 1500000, // 1.5 million km tail
    visualTailColor: "#F0F8FF",
    visualTailOpacity: 0.5,
  },
};
