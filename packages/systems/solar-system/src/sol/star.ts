import {
  CelestialType,
  StellarType,
  CelestialStatus,
  type StarProperties,
  CelestialObject,
} from "@teskooano/data-types";
import { createOrbitalElements, kmToM } from "@teskooano/core-physics";

const SUN_MASS_KG = 1.9885e30;
const SUN_RADIUS_KM = 696340; // Solar radius
const SUN_TEMP_K = 5778;
const SUN_LUMINOSITY = 1.0;

/**
 * Sun configuration object for modular solar system initialization.
 * Data primarily sourced from NASA Planetary Fact Sheet & JPL Horizons.
 */
export const sun: CelestialObject<StarProperties> = {
  id: "sun",
  name: "Sun",
  seed: "sun_seed_string_111",
  type: CelestialType.STAR,
  status: CelestialStatus.ACTIVE,
  parentId: undefined, // Sun has no parent
  realMass_kg: SUN_MASS_KG,
  realRadius_m: kmToM(SUN_RADIUS_KM),
  temperature: SUN_TEMP_K,
  albedo: 0.3,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0, // Sun is at the center of the system
    eccentricity: 0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 0,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: "G2V",
    luminosity: SUN_LUMINOSITY,
    color: "#FFFFE0",
    stellarType: StellarType.MAIN_SEQUENCE,
  },
};
