import {
  CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import { createOrbitalElements } from "@teskooano/core-physics";

// Geostationary satellite orbital parameters (exact physics)
const GEOSTATIONARY_SEMI_MAJOR_AXIS_KM = 42164; // From physics: r = ∛(μT²/4π²)
const GEOSTATIONARY_SEMI_MAJOR_AXIS_M = GEOSTATIONARY_SEMI_MAJOR_AXIS_KM * 1000;
const SIDEREAL_DAY_SECONDS = 86164.09054; // Exact sidereal day from physics
const EARTH_AXIAL_TILT_DEG = 23.4392811; // Must match Earth's axial tilt exactly
const GEOSTATIONARY_ECCENTRICITY = 0.0; // Must be exactly circular

// Calculate orbital velocity directly for Earth satellite
// v = sqrt(GM/r) where GM = 3.986e14 m³/s² for Earth
const EARTH_GM = 3.986e14; // m³/s²
const GEOSTATIONARY_ORBITAL_VELOCITY_MS = Math.sqrt(
  EARTH_GM / GEOSTATIONARY_SEMI_MAJOR_AXIS_M,
); // ~3070 m/s

export const geostationarySat: CelestialObject<SatelliteProperties> = {
  id: "geostationary-comsat",
  name: "Geostationary CommSat",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  // Physical properties
  realMass_kg: 5500, // ~5.5 tons (typical large communications satellite)
  realRadius_m: 10.0, // Larger communications satellite
  temperature: 280, // Stable operating temperature
  albedo: 0.6, // Higher reflectivity (large solar arrays)

  // Orbital elements (Earth-relative)
  orbit: createOrbitalElements({
    semiMajorAxisAU: GEOSTATIONARY_SEMI_MAJOR_AXIS_KM / 149597870.7,
    eccentricity: GEOSTATIONARY_ECCENTRICITY, // Exactly 0 (circular)
    inclinationDeg: EARTH_AXIAL_TILT_DEG, // KEY FIX: Match Earth's axial tilt
    longitudeOfAscendingNodeDeg: 0.0, // Above 0° longitude
    argumentOfPeriapsisDeg: 0.0, // Undefined for circular orbit, but set to 0
    meanAnomalyDeg: 0,
    // CRITICAL: Must exactly match Earth's sidereal rotation period
    period_s: SIDEREAL_DAY_SECONDS, // 86164.09054 s (exact sidereal day)
    siderealRotationPeriod_s: SIDEREAL_DAY_SECONDS,
    axialTiltDeg: 0,
  }),

  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "./models/satellite/satellite.glb",
    modelScale: 1.0, // Larger scale for bigger satellite
    missionType: "communications",
    operationalStatus: "active",
    launchDate: "2020-05-15", // Representative modern comsat
    components: [
      "High-gain antennas",
      "Transponders",
      "Large solar arrays",
      "Reaction wheels",
      "Ion thrusters",
      "Communications payload",
    ],
  },
};
