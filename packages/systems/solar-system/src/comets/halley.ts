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
 * Halley's Comet (1P/Halley)
 *
 * One of the most famous comets, with a period of about 76 years.
 * It's a long-period comet that has been observed for over 2000 years.
 */
export const halley: CelestialObject<CometProperties> = {
  id: "halley",
  name: "Halley's Comet",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 2.2e14, // ~220 billion tons
  realRadius_m: 5500, // ~5.5 km nucleus radius
  temperature: 200, // Cold when far from Sun
  orbit: createOrbitalElements({
    semiMajorAxisAU: 17.93, // From provided data
    eccentricity: 0.9679, // From provided data
    inclinationDeg: 162.19, // From provided data
    longitudeOfAscendingNodeDeg: 59.11, // From provided data
    argumentOfPeriapsisDeg: 112.26, // From provided data
    meanAnomalyDeg: 274.14, // From provided data
    period_s: 27731.29225689917 * 24 * 3600, // 75.92414033374175 years in seconds
    siderealRotationPeriod_s: 52.8 * 3600, // 52.8 hours (unchanged)
    axialTiltDeg: 0, // Tumbling object
    epoch: "JD 2439857.5", // Updated epoch
    timeOfPerihelion: "1986-02-08T04:45:36.000Z", // 1986-Feb-08.19833721 TDB
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.LONG_PERIOD,
    discoveredDate: "240 BCE", // First recorded observation by Chinese astronomers
    composition: ["water ice", "CO2", "methane", "ammonia"],
    colors: ["#1e1e1e", "#3a3a3a", "#5a5a5a", "#808080"],
    heights: [0.0, 0.25, 0.5, 0.75],
    activity: 0.8, // Active when near perihelion
    visualComaRadius: 100000, // 100 km coma radius
    visualComaColor: "#87CEEB",
    visualComaOpacity: 0.7,
    visualMaxTailLength: 10000000, // 10 million km tail
    visualTailColor: "#DCE6FF",
    visualTailOpacity: 0.6,
    visuals: {
      noiseScale: 1.9,
      blendSharpness: 1.3,
      craterScale: 17.0,
      craterStrength: 0.85,
      simplePeriod: 2.2,
      undulation: 0.18,
      ambientStrength: 0.012,
      metallicFactor: 0.02,
      roughness: 0.9,
      specularColor: new THREE.Color("#dedede"),
    },
  },
};
