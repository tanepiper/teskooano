import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  AsteroidClass,
  AsteroidProperties,
  type CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";

/**
 * Vesta asteroid configuration object based on accurate Dawn mission data.
 *
 * Vesta is the second-most massive object in the asteroid belt and was
 * extensively studied by NASA's Dawn spacecraft (2011-2012). It features
 * the massive Rheasilvia crater at its south pole and has a differentiated
 * interior similar to terrestrial planets.
 *
 * Discovery: Heinrich Wilhelm Olbers, 29 March 1807
 * Spectral type: V-type (basaltic composition)
 */
export const vesta: CelestialObject<AsteroidProperties> = {
  id: "vesta",
  name: "4 Vesta",
  seed: "vesta",
  type: CelestialType.ASTEROID,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 2.590271e20, // ±0.000058×10^20 kg (Dawn mission precision)
  realRadius_m: kmToM(262.7), // Mean radius from mean diameter 525.4 km
  temperature: 162.5, // Average of min 75K and max 250K
  albedo: 0.423, // Geometric albedo
  orbit: createOrbitalElements({
    semiMajorAxisAU: 2.36, // 353 million km
    eccentricity: 0.0894,
    inclinationDeg: 7.1422, // to ecliptic
    longitudeOfAscendingNodeDeg: 103.71,
    argumentOfPeriapsisDeg: 151.66,
    meanAnomalyDeg: 169.4, // Epoch 13 September 2023
    period_s: 114554304, // 3.63 years = 1325.86 days
    siderealRotationPeriod_s: 19231, // 5.342 hours
    axialTiltDeg: 29,
  }),
  properties: {
    type: CelestialType.ASTEROID,
    classType: AsteroidClass.BELT, // Vesta family, main belt asteroid
    composition: "differentiated basaltic rock with metallic core", // V-type spectral class
    colors: [
      "#4A3728", // Dark basaltic regions
      "#6B4A3A", // Pyroxene-rich areas
      "#8B5A42", // Olivine-bearing terrain
      "#A16B4F", // Brighter highland material
    ],
    heights: [0.0, 0.3, 0.6, 1.0], // Elevation thresholds for color transitions
    density: 3.456, // g/cm³ from Dawn mission data
    temperature: 162.5, // Average temperature in Kelvin
    activity: 0.1, // Low activity for main belt asteroid
    visuals: {
      noiseScale: 1.2,
      blendSharpness: 0.8,
      craterScale: 2.5, // Prominent Rheasilvia crater and others
      craterStrength: 0.7, // Well-defined crater features
      simplePeriod: 2.0,
      undulation: 0.6, // Complex cratered terrain
      ambientStrength: 0.02,
      metallicFactor: 0.1, // Some metallic content from differentiation
      roughness: 0.8, // Heavily cratered surface
    },
  },
};
