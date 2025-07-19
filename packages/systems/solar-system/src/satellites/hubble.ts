import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
  CelestialObject,
} from "@teskooano/data-types";

// Hubble Space Telescope physical constants (current as of 2024)
const HUBBLE_MASS_KG = 11_110; // 11.1 tons
const HUBBLE_ALTITUDE_KM = 539; // Current average altitude (537-541 km range)
const HUBBLE_INCLINATION_DEG = 28.47;
const HUBBLE_PERIOD_MINUTES = 95.42;
const HUBBLE_ECCENTRICITY = 0.0001;

/**
 * Hubble configuration object for modular solar system initialization.
 */
export const hubble: CelestialObject<SatelliteProperties> = {
  id: "hubble",
  name: "Hubble Space Telescope",
  seed: "hst_great_observatory",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth", // Will be replaced during initialization
  realMass_kg: HUBBLE_MASS_KG,
  realRadius_m: 7, // Approximate radius for visualization (13.2m x 4.2m dimensions)
  temperature: 288, // ~15°C stable temperature
  albedo: 0.3, // Dark surfaces with some reflective components
  orbit: {
    realSemiMajorAxis_m: 6.371e6 + HUBBLE_ALTITUDE_KM * KM, // Earth radius + altitude
    eccentricity: HUBBLE_ECCENTRICITY,
    inclination: HUBBLE_INCLINATION_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: 85.0 * DEG_TO_RAD,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: HUBBLE_PERIOD_MINUTES * 60,
    siderealRotationPeriod_s: HUBBLE_PERIOD_MINUTES * 60,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/hubble.glb", // Fixed path format
    modelScale: 0.1, // Reduced from 0.7 to 0.4 for better size
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1990-04-24",
    components: [
      "2.4m primary mirror",
      "Scientific instruments",
      "Solar arrays",
      "Fine guidance sensors",
      "Pointing system",
    ],
  },
};
