import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";

// James Webb Space Telescope physical constants
const JWST_MASS_KG = 6_500; // ~6.5 tons
const JWST_DISTANCE_AU = 0.01; // ~1.5 million km from Earth (L2 Lagrange point)
const JWST_ORBITAL_PERIOD_DAYS = 365.25; // Orbits Sun with Earth at L2
const JWST_ECCENTRICITY = 0.0;

/**
 * Initializes the James Webb Space Telescope.
 * JWST is positioned at the Sun-Earth L2 Lagrange point, about 1.5 million km
 * from Earth, where it can observe the universe in infrared light.
 */
export function initializeJWST(parentId: string): void {
  const earthDistance = JWST_DISTANCE_AU * AU;
  const earthOrbitRadius = 1.0 * AU; // Earth's distance from Sun
  const jwstOrbitRadius = earthOrbitRadius + earthDistance;

  actions.addCelestial({
    id: "jwst",
    name: "James Webb Space Telescope",
    seed: "jwst_infrared_observatory",
    type: CelestialType.SATELLITE,
    status: CelestialStatus.ACTIVE,
    parentId: parentId, // Orbits the Sun, not Earth
    realMass_kg: JWST_MASS_KG,
    realRadius_m: 10, // Approximate radius for visualization (21m diameter sunshield)
    temperature: 300, // More realistic temperature for lighting calculations
    albedo: 0.3, // More realistic albedo for visibility

    orbit: {
      realSemiMajorAxis_m: jwstOrbitRadius,
      eccentricity: JWST_ECCENTRICITY,
      inclination: 0, // Same plane as Earth
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0, // Start at same position as Earth
      period_s: JWST_ORBITAL_PERIOD_DAYS * 24 * 3600,
      siderealRotationPeriod_s: JWST_ORBITAL_PERIOD_DAYS * 24 * 3600,
      axialTilt: new OSVector3(0, 1, 0).normalize(),
    },

    physicsStateReal: {
      id: "jwst",
      mass_kg: JWST_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },

    properties: {
      type: CelestialType.SATELLITE,
      modelPath: "models/satellite/jwst.glb", // Fixed path format
      modelScale: 1.2,
      missionType: "scientific",
      operationalStatus: "active",
      launchDate: "2021-12-25",
      description:
        "NASA/ESA/CSA infrared space telescope at L2 Lagrange point, studying the early universe and exoplanets",
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
    } as SatelliteProperties,
  });
}
