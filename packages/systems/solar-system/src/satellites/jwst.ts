import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
  CelestialObject,
} from "@teskooano/data-types";

// James Webb Space Telescope physical constants
const JWST_MASS_KG = 6_500; // ~6.5 tons
const JWST_DISTANCE_KM = 1500000; // ~1.5 million km from Earth (L2 Lagrange point)
const JWST_DISTANCE_AU = JWST_DISTANCE_KM / 149597870.7; // ~0.01 AU

// JWST J2000 coordinates (current position)
// Right Ascension: 18h 18m 11s = 18.303056 hours = 274.545833 degrees
// Declination: -32° 22' 14" = -32.370556 degrees
const JWST_RA_DEG = 274.545833;
const JWST_DEC_DEG = -32.370556;

/**
 * JWST configuration object for modular solar system initialization.
 * Current J2000 position: RA 18h 18m 11s, Dec -32° 22' 14"
 * Located at Earth-Sun L2 Lagrange point (~1.5 million km from Earth)
 */
export const jwst: CelestialObject<SatelliteProperties> = {
  id: "jwst",
  name: "James Webb Space Telescope",
  seed: "jwst_infrared_observatory",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth", // Will be replaced during initialization - orbits the Sun at L2
  realMass_kg: JWST_MASS_KG,
  realRadius_m: 10, // Approximate radius for visualization (21m diameter sunshield)
  temperature: 300, // More realistic temperature for lighting calculations
  albedo: 0.3, // More realistic albedo for visibility
  orbit: createOrbitalElements({
    semiMajorAxisAU: JWST_DISTANCE_AU, // Distance from Earth to L2 (~0.01 AU)
    eccentricity: 0.0, // Stationary at L2 point
    inclinationDeg: 0, // Same plane as Earth's orbit
    longitudeOfAscendingNodeDeg: 0, // Will be positioned by celestial coordinates
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0, // Current position
    period_s: 365.25 * 24 * 3600, // ~1 year (moves with Earth)
    siderealRotationPeriod_s: 365.25 * 24 * 3600,
    axialTiltDeg: 0,
    epoch: "J2000", // Use J2000 epoch for the coordinates
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
