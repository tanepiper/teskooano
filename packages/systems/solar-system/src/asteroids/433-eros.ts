import {
  CONVERSION,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  type AsteroidProperties,
  type CelestialObject,
  AsteroidClass,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import * as THREE from "three";

/**
 * 433 Eros asteroid configuration object.
 * Data sourced from: [[https://en.wikipedia.org/wiki/433_Eros]]
 */
export const eros: CelestialObject<AsteroidProperties> = {
  id: "433-eros",
  name: "433 Eros",
  seed: "433-eros",
  type: CelestialType.ASTEROID,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Or a more appropriate parent if in a specific simulation
  realMass_kg: 6.687e15, // (6.687±0.003)×10^15 kg
  realRadius_m: kmToM(16.84) / 2, // 16.84 km mean diameter
  temperature: 200, // Estimated temperature in Kelvin, typical for asteroids
  albedo: 0.25, // Geometric albedo: 0.25±0.06
  orbit: createOrbitalElements({
    semiMajorAxisAU: 1.4579,
    eccentricity: 0.2226,
    inclinationDeg: 10.828,
    longitudeOfAscendingNodeDeg: 304.32,
    argumentOfPeriapsisDeg: 178.82, // Corrected from argumentOfPerihelionDeg
    meanAnomalyDeg: 71.28,
    period_s: 643 * CONVERSION.DAYS_TO_S, // 643 days to seconds
    siderealRotationPeriod_s: 5.27 * CONVERSION.HOURS_TO_S, // 5.270 hours to seconds
    axialTiltDeg: 0, // Not provided, assuming 0
    epoch: "J2000", // Standard epoch
  }),
  properties: {
    type: CelestialType.ASTEROID,
    classType: AsteroidClass.SHORT_PERIOD,
    colors: ["#5a4a35", "#6f5b41", "#8a6e50", "#a08060"],
    heights: [0.0, 0.45, 0.65, 0.85],
    composition: "silicates, iron",
    density: 2.67, // 2.67±0.03 g/cm3
    temperature: 200, // Placeholder, usually not specified for asteroids in this detail
    activity: 0.0, // Asteroids are generally inactive
    visuals: {
      noiseScale: 1.8,
      blendSharpness: 1.2,
      craterScale: 18.0,
      craterStrength: 0.6,
      simplePeriod: 1.5,
      undulation: 0.2,
      ambientStrength: 0.02,
      metallicFactor: 0.3, // S-type has some metallic content
      roughness: 0.7, // Moderately rough
      specularColor: new THREE.Color("#cccccc"), // Off-white/gray specular highlights
    },
  },
};
