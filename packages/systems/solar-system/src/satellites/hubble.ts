import {
  CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import { createOrbitalElements } from "@teskooano/core-physics";

// Hubble Space Telescope orbital parameters
const HUBBLE_ALTITUDE_KM = 539;
const EARTH_RADIUS_KM = 6371;
const HUBBLE_ORBITAL_RADIUS_KM = EARTH_RADIUS_KM + HUBBLE_ALTITUDE_KM;
const HUBBLE_ORBITAL_RADIUS_M = HUBBLE_ORBITAL_RADIUS_KM * 1000;
const HUBBLE_PERIOD_MINUTES = 95.42;
const HUBBLE_PERIOD_SECONDS = HUBBLE_PERIOD_MINUTES * 60;
const HUBBLE_ECCENTRICITY = 0.0001;
const HUBBLE_INCLINATION_DEG = 28.47;

// Calculate orbital velocity directly for Earth satellite
// v = sqrt(GM/r) where GM = 3.986e14 m³/s² for Earth
const EARTH_GM = 3.986e14; // m³/s²
const HUBBLE_ORBITAL_VELOCITY_MS = Math.sqrt(
  EARTH_GM / HUBBLE_ORBITAL_RADIUS_M,
); // ~7550 m/s

export const hubble: CelestialObject<SatelliteProperties> = {
  id: "hubble",
  name: "Hubble Space Telescope",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  // Physical properties
  realMass_kg: 11110, // 11.1 tons
  realRadius_m: 7, // Approximate radius for visualization (13.2m x 4.2m dimensions)
  temperature: 288, // ~15°C stable temperature
  albedo: 0.3, // Dark surfaces with some reflective components

  // Orbital elements (Earth-relative)
  orbit: createOrbitalElements({
    semiMajorAxisAU: HUBBLE_ORBITAL_RADIUS_KM / 149597870.7,
    eccentricity: HUBBLE_ECCENTRICITY,
    inclinationDeg: HUBBLE_INCLINATION_DEG,
    longitudeOfAscendingNodeDeg: 85.0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: HUBBLE_PERIOD_SECONDS,
    siderealRotationPeriod_s: HUBBLE_PERIOD_SECONDS, // Tidal locked to Earth
    axialTiltDeg: 0,
  }),

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
