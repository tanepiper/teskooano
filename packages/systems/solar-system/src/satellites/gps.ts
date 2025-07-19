import {
  CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import { createOrbitalElements } from "@teskooano/core-physics";

// GPS satellite orbital parameters
const GPS_ALTITUDE_KM = 20200;
const EARTH_RADIUS_KM = 6371;
const GPS_ORBITAL_RADIUS_KM = EARTH_RADIUS_KM + GPS_ALTITUDE_KM;
const GPS_ORBITAL_RADIUS_M = GPS_ORBITAL_RADIUS_KM * 1000;
const GPS_PERIOD_HOURS = 11.967;
const GPS_PERIOD_SECONDS = GPS_PERIOD_HOURS * 3600;
const GPS_ECCENTRICITY = 0.02;
const GPS_INCLINATION_DEG = 55.0;

// Calculate orbital velocity directly for Earth satellite
// v = sqrt(GM/r) where GM = 3.986e14 m³/s² for Earth
const EARTH_GM = 3.986e14; // m³/s²
const GPS_ORBITAL_VELOCITY_MS = Math.sqrt(EARTH_GM / GPS_ORBITAL_RADIUS_M); // ~3870 m/s

export const gps: CelestialObject<SatelliteProperties> = {
  id: "gps-satellite",
  name: "GPS Satellite",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  // Physical properties
  realMass_kg: 2070, // ~2 tons (GPS Block III)
  realRadius_m: 3, // Approximate radius for visualization
  temperature: 285, // Stable operating temperature
  albedo: 0.5, // Moderate reflectivity

  // Orbital elements (Earth-relative)
  orbit: createOrbitalElements({
    semiMajorAxisAU: GPS_ORBITAL_RADIUS_KM / 149597870.7,
    eccentricity: GPS_ECCENTRICITY,
    inclinationDeg: GPS_INCLINATION_DEG,
    longitudeOfAscendingNodeDeg: 45.0,
    argumentOfPeriapsisDeg: 30.0,
    meanAnomalyDeg: 0,
    period_s: GPS_PERIOD_SECONDS,
    siderealRotationPeriod_s: GPS_PERIOD_SECONDS, // Tidal locked to Earth
    axialTiltDeg: 0,
  }),

  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "./models/satellite/satellite.glb",
    modelScale: 1.0,
    missionType: "navigation",
    operationalStatus: "active",
    launchDate: "2018-12-23", // Representative Block III launch
    components: [
      "Atomic clocks",
      "Navigation payload",
      "Solar arrays",
      "L-band antennas",
      "Search and rescue payload",
    ],
  },
};
