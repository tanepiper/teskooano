import {
  CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import {
  createOrbitalElements,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";

// ISS orbital parameters
const ISS_ALTITUDE_KM = 415;
const EARTH_RADIUS_KM = 6371;
const ISS_ORBITAL_RADIUS_KM = EARTH_RADIUS_KM + ISS_ALTITUDE_KM;
const ISS_ORBITAL_RADIUS_M = ISS_ORBITAL_RADIUS_KM * 1000;
const ISS_PERIOD_MINUTES = 90;
const ISS_PERIOD_SECONDS = ISS_PERIOD_MINUTES * 60;
const ISS_ECCENTRICITY = 0.001;
const ISS_INCLINATION_DEG = 51.6;

// Calculate orbital velocity directly for Earth satellite
// v = sqrt(GM/r) where GM = 3.986e14 m³/s² for Earth
const EARTH_GM = 3.986e14; // m³/s²
const ISS_ORBITAL_VELOCITY_MS = Math.sqrt(EARTH_GM / ISS_ORBITAL_RADIUS_M); // ~7660 m/s

export const iss: CelestialObject<SatelliteProperties> = {
  id: "iss",
  name: "International Space Station",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  // Physical properties
  realMass_kg: 419725, // ~420 metric tons
  realRadius_m: 109, // Maximum dimension
  temperature: 288, // ~15°C stable temperature
  albedo: 0.3, // Dark surfaces with some reflective components
  // Orbital elements (Earth-relative)
  orbit: createOrbitalElements({
    semiMajorAxisAU: ISS_ORBITAL_RADIUS_KM / 149597870.7,
    eccentricity: ISS_ECCENTRICITY,
    inclinationDeg: ISS_INCLINATION_DEG,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: ISS_PERIOD_SECONDS,
    siderealRotationPeriod_s: ISS_PERIOD_SECONDS, // Tidal locked to Earth
    axialTiltDeg: 0,
  }),

  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/iss.glb", // Fixed path format
    modelScale: 1, // Reduced from 0.7 to 0.4 for better size
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1998-11-20",
    components: [
      "2.4m primary mirror",
      "Scientific instruments",
      "Solar arrays",
      "Communication systems",
    ],
  },
};
