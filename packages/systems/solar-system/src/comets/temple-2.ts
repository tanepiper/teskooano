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
 * Temple 2 Comet (10P/Tempel 2)
 *
 * A short-period comet with a period of about 5.4 years.
 * It's a Jupiter-family comet that has been observed for over 100 years.
 */
export const temple2: CelestialObject<CometProperties> = {
  id: "temple-2",
  name: "10P/Tempel 2",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 1e13, // ~10 billion tons
  realRadius_m: 10600, // ~10.6 km nucleus radius
  temperature: 200, // Cold when far from Sun
  orbit: createOrbitalElements({
    semiMajorAxisAU: 3.064,
    eccentricity: 0.53738,
    inclinationDeg: 12.027,
    longitudeOfAscendingNodeDeg: 117.8,
    argumentOfPeriapsisDeg: 195.5,
    meanAnomalyDeg: 276.53,
    period_s: 5.4 * 365.25 * 24 * 3600, // 5.4 years
    siderealRotationPeriod_s: 8.9 * 3600, // 8.9 hours
    axialTiltDeg: 0, // Tumbling object
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.SHORT_PERIOD,
    discoveredDate: "1867-03-13",
    composition: ["water ice", "dust"],
    colors: ["#332211", "#4d331a", "#664422", "#80552b"],
    heights: [0.0, 0.4, 0.65, 0.9],
    activity: 0.5, // Moderate activity
    visualComaRadius: 40000, // 40 km coma radius
    visualComaColor: "#E6E6FA",
    visualComaOpacity: 0.5,
    visualMaxTailLength: 1200000, // 1.2 million km tail
    visualTailColor: "#E6E6FA",
    visualTailOpacity: 0.4,
    visuals: {
      noiseScale: 2.5,
      blendSharpness: 0.9,
      craterScale: 28.0,
      craterStrength: 0.65,
      simplePeriod: 3.0,
      undulation: 0.3,
      ambientStrength: 0.018,
      metallicFactor: 0.15,
      roughness: 0.8,
      specularColor: new THREE.Color("#d3b8a0"),
    },
  },
};
