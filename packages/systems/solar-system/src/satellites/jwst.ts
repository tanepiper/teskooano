import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
  CelestialObject,
} from "@teskooano/data-types";

// James Webb Space Telescope physical constants
const JWST_MASS_KG = 6_500; // ~6.5 tons
const JWST_DISTANCE_AU = 0.01; // ~1.5 million km from Earth (L2 Lagrange point)
const JWST_ORBITAL_PERIOD_DAYS = 365.25; // Orbits Sun with Earth at L2
const JWST_ECCENTRICITY = 0.0;

/**
 * JWST configuration object for modular solar system initialization.
 */
export const jwst: CelestialObject<SatelliteProperties> = {
  id: "jwst",
  name: "James Webb Space Telescope",
  seed: "jwst_infrared_observatory",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization - orbits the Sun at L2
  realMass_kg: JWST_MASS_KG,
  realRadius_m: 10, // Approximate radius for visualization (21m diameter sunshield)
  temperature: 300, // More realistic temperature for lighting calculations
  albedo: 0.3, // More realistic albedo for visibility
  orbit: createOrbitalElements({
    semiMajorAxisAU: 1.0 + JWST_DISTANCE_AU, // Earth's orbit + L2 distance
    eccentricity: JWST_ECCENTRICITY,
    inclinationDeg: 0, // Same plane as Earth
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0, // Start at same position as Earth
    period_s: JWST_ORBITAL_PERIOD_DAYS * 24 * 3600,
    siderealRotationPeriod_s: JWST_ORBITAL_PERIOD_DAYS * 24 * 3600,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/jwst.glb", // Fixed path format
    modelScale: 1.2,
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "2021-12-25",
    components: [
      "6.5m segmented primary mirror",
      "Five-layer sunshield",
      "Infrared instruments",
      "Spacecraft bus",
      "High-gain antenna",
    ],
    // JWST-specific material properties for better reflection
    materialProperties: {
      metalness: 0.9, // Highly metallic for gold foil and mirrors
      roughness: 0.1, // Very smooth for reflective surfaces
      envMapIntensity: 1.5, // Strong environment reflections
    },
  },
};
