import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  type CelestialObject,
  AsteroidProperties,
  AsteroidClass,
} from "@teskooano/data-types";

/**
 * Pallas asteroid configuration object based on accurate astronomical data.
 *
 * Pallas is the third-largest asteroid in the main belt and was discovered
 * by Heinrich Wilhelm Olbers on 28 March 1802. It has a highly inclined
 * orbit and is the largest B-type asteroid, indicating a primitive carbonaceous
 * composition with possible water ice content.
 */
export const pallas: CelestialObject<AsteroidProperties> = {
  id: "pallas",
  name: "2 Pallas",
  seed: "pallas",
  type: CelestialType.ASTEROID,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 2.042e20, // Accurate mass from latest observations
  realRadius_m: kmToM(256), // Mean diameter ~512 km
  temperature: 160,
  albedo: 0.155, // Geometric albedo from observations
  orbit: createOrbitalElements({
    semiMajorAxisAU: 2.77, // 414 million km
    eccentricity: 0.2302, // High eccentricity
    inclinationDeg: 34.93, // Very high inclination
    longitudeOfAscendingNodeDeg: 172.9,
    argumentOfPeriapsisDeg: 310.9, // Updated from 310.3
    meanAnomalyDeg: 40.6, // Updated to September 2023 epoch
    period_s: 1.684e8, // 4.611 years (1,684.0 days)
    siderealRotationPeriod_s: 28128, // 7.8132 hours
    axialTiltDeg: 84, // High axial tilt
  }),
  properties: {
    type: CelestialType.ASTEROID,
    classType: AsteroidClass.BELT, // Main belt asteroid, Pallas family
    composition: "primitive carbonaceous material with possible water ice", // B-type spectral class
    colors: [
      "#2F1B14", // Very dark carbonaceous material
      "#4A2F1A", // Darker regions with organic compounds
      "#6B4A2A", // Slightly brighter areas
      "#8B6B3A", // Brighter patches
    ],
    heights: [0.0, 0.3, 0.6, 1.0], // Elevation thresholds for color transitions
    density: 2.92, // g/cm³ from latest observations
    temperature: 160, // Average temperature in Kelvin
    activity: 0.05, // Very low activity for primitive asteroid
    visuals: {
      noiseScale: 1.5,
      blendSharpness: 0.7,
      craterScale: 1.8, // Moderate cratering
      craterStrength: 0.5, // Moderate crater features
      simplePeriod: 2.5,
      undulation: 0.4, // Moderate terrain variation
      ambientStrength: 0.015, // Low albedo surface
      metallicFactor: 0.02, // Primitive composition, low metal content
      roughness: 0.6, // Moderately rough surface
    },
  },
};
