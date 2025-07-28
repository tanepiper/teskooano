import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";
import * as THREE from "three";

/**
 * Encke's Comet (2P/Encke)
 *
 * A short-period comet with the shortest orbital period of any known comet.
 * It completes an orbit around the Sun every 3.3 years.
 */
export const encke: CelestialObject<CometProperties> = {
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
    classType: CometClass.SHORT_PERIOD,
    discoveredDate: "1805-03-13",
    composition: ["water ice", "CO2", "dust"],
    colors: ["#3d3d3d", "#555555", "#6c6c6c", "#8e8e8e"],
    heights: [0.0, 0.4, 0.6, 0.85],
    activity: 0.6, // Moderate activity
    visualComaRadius: 50000, // 50 km coma radius
    visualComaColor: "#98FB98",
    visualComaOpacity: 0.6,
    visualMaxTailLength: 2000000, // 2 million km tail
    visualTailColor: "#F0E68C",
    visualTailOpacity: 0.5,
    visuals: {
      noiseScale: 2.0,
      blendSharpness: 1.0,
      craterScale: 25.0,
      craterStrength: 0.7,
      simplePeriod: 2.8,
      undulation: 0.25,
      ambientStrength: 0.015,
      metallicFactor: 0.1,
      roughness: 0.85,
      specularColor: new THREE.Color("#c0c0c0"),
    },
  },
};
