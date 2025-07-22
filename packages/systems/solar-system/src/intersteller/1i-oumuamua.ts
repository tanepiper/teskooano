import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometOrbitType,
  type CometProperties,
} from "@teskooano/data-types";

/**
 * 1I/'Oumuamua
 *
 * The first known interstellar object to pass through our solar system.
 * Discovered in 2017, it has a hyperbolic orbit indicating it came from outside our solar system.
 * No outgassing was observed, suggesting it may be an extinct comet or asteroid.
 */
export const oumuamua: CelestialObject = {
  id: "1i-oumuamua",
  name: "1I/'Oumuamua",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 2.3e8, // ~230 million tons
  realRadius_m: 115, // ~115m radius (estimated)
  temperature: 200, // Cold interstellar object
  orbit: createOrbitalElements({
    semiMajorAxisAU: -1.28, // Negative for hyperbolic orbit
    eccentricity: 1.201,
    inclinationDeg: 122.74,
    longitudeOfAscendingNodeDeg: 24.6,
    argumentOfPeriapsisDeg: 241.8,
    meanAnomalyDeg: 0,
    period_s: 0, // No period for hyperbolic orbits
    siderealRotationPeriod_s: 8.67 * 3600, // 8.67 hours
    axialTiltDeg: 0, // Tumbling object
    isHyperbolic: true,
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometOrbitType.INTERSTELLAR,
    composition: ["rock", "metal"], // No ice detected
    activity: 0.0, // No outgassing observed
    visualComaRadius: 0, // No coma
    visualComaColor: "#8B4513",
    visualComaOpacity: 0.0,
    visualMaxTailLength: 0, // No tail
    visualTailColor: "#8B4513",
    visualTailOpacity: 0.0,
  } as CometProperties,
};
