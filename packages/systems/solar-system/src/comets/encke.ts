import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometOrbitType,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * Encke's Comet (2P/Encke)
 *
 * A short-period comet with the shortest orbital period of any known comet.
 * It completes an orbit around the Sun every 3.3 years.
 */
export const encke: CelestialObject = {
  id: "encke",
  name: "Encke's Comet",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 1.2e13, // ~12 billion tons
  realRadius_m: 2500, // ~2.5 km nucleus radius
  temperature: 250, // Warmer due to frequent perihelion passages
  orbit: createOrbitalElements({
    semiMajorAxisAU: 2.22,
    eccentricity: 0.847,
    inclinationDeg: 11.78,
    longitudeOfAscendingNodeDeg: 334.57,
    argumentOfPeriapsisDeg: 186.54,
    meanAnomalyDeg: 160.0,
    period_s: 3.3 * 365.25 * 24 * 3600, // 3.3 years
    siderealRotationPeriod_s: 11.1 * 3600, // 11.1 hours
    axialTiltDeg: 0, // Tumbling object
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometOrbitType.SHORT_PERIOD,
    composition: ["water ice", "CO2", "dust"],
    activity: 0.6, // Moderate activity
    visualComaRadius: 50000, // 50 km coma radius
    visualComaColor: "#98FB98",
    visualComaOpacity: 0.6,
    visualMaxTailLength: 2000000, // 2 million km tail
    visualTailColor: "#F0E68C",
    visualTailOpacity: 0.5,
  } as CometProperties,
};
