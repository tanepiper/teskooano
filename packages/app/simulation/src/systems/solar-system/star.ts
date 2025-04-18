import { actions } from "@teskooano/core-state";
import { CelestialType, StellarType } from "@teskooano/data-types";

// --- Constants ---
const SUN_MASS_KG = 1.9885e30; // More precise value
const SUN_RADIUS_M = 696340000; // Mean radius
const SUN_TEMP_K = 5778; // Effective temperature
const SUN_LUMINOSITY = 1.0; // By definition (relative to Sun)

/**
 * Initializes the Sun object using accurate data.
 * Data primarily sourced from NASA Planetary Fact Sheet & JPL Horizons.
 * @returns The ID of the created star.
 */
export function initializeSun(): string {
  const sunId = actions.createSolarSystem({
    id: "sol",
    name: "Sun",
    type: CelestialType.STAR,
    realMass_kg: SUN_MASS_KG,
    realRadius_m: SUN_RADIUS_M,
    temperature: SUN_TEMP_K,
    albedo: 0.3, // Placeholder albedo for stars if needed
    seed: "sun_seed_string_111", // Added top-level seed
    orbit: {
      // Sun is the central body, orbit is effectively zero
      realSemiMajorAxis_m: 0,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 0,
    },
    properties: {
      type: CelestialType.STAR,
      isMainStar: true,
      spectralClass: "G2V", // Standard classification
      luminosity: SUN_LUMINOSITY,
      color: "#FFFFE0", // Light yellow color typical for G2V
      stellarType: StellarType.MAIN_SEQUENCE_G, // Specific type if available, else MAIN_SEQUENCE
    },
  });

  return sunId;
}
