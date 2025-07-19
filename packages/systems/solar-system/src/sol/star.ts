import {
  CelestialType,
  StellarType,
  CelestialStatus,
  type StarProperties,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";

const SUN_MASS_KG = 1.9885e30;
const SUN_RADIUS_M = 696340 * KM; // Solar radius
const SUN_TEMP_K = 5778;
const SUN_LUMINOSITY = 1.0;

/**
 * Sun configuration object for modular solar system initialization.
 * Data primarily sourced from NASA Planetary Fact Sheet & JPL Horizons.
 */
export const sun = {
  id: "sun",
  name: "Sun",
  seed: "sun_seed_string_111",
  type: CelestialType.STAR,
  status: CelestialStatus.ACTIVE,
  parentId: undefined, // Sun has no parent
  realMass_kg: SUN_MASS_KG,
  realRadius_m: SUN_RADIUS_M,
  temperature: SUN_TEMP_K,
  albedo: 0.3,
  orbit: {
    realSemiMajorAxis_m: 0,
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 0,
    siderealRotationPeriod_s: 0,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  properties: {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: "G2V",
    luminosity: SUN_LUMINOSITY,
    color: "#FFFFE0",
    stellarType: StellarType.MAIN_SEQUENCE,
  } as StarProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the sun configuration object instead.
 */
export function initializeSun(): string {
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
  return sun.id;
}
