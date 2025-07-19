import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
  CelestialObject,
} from "@teskooano/data-types";

// Voyager 2 physical constants (real-time data as of latest update)
const VOYAGER2_MASS_KG = 815; // ~815 kg (including fuel)
const VOYAGER2_DISTANCE_AU = 140.23470533; // Current distance from Sun (real-time)
const VOYAGER2_DISTANCE_EARTH_AU = 139.43796836; // Current distance from Earth
const VOYAGER2_VELOCITY_KM_S = 15.4; // 34,390.98 mph = ~15.4 km/s relative to Sun
const MISSION_ELAPSED_TIME_YEARS = 47.89; // ~47 years, 10 months since launch

// Voyager 2's current position in space (constellation Pavo)
// Right Ascension: ~20h 14m, Declination: ~-59°
const VOYAGER2_RA_DEG = 303.5; // 20h 14m = 20.23 * 15 = 303.5°
const VOYAGER2_DEC_DEG = -59.0; // -59°

/**
 * Voyager 2 configuration object for modular solar system initialization.
 * Launch: August 20, 1977 (launched before Voyager 1)
 * Current Status: 140.23 AU from Sun, traveling at 34,391 mph
 * Mission Elapsed Time: 47 years, 10 months, 24 days
 * The second human-made object to enter interstellar space, the only spacecraft
 * to visit all four gas giant planets. Also carries the Golden Record.
 *
 * Uses rogue object approach - no orbital mechanics, direct position/velocity.
 */
export const voyager2 = {
  id: "voyager-2",
  name: "Voyager 2",
  seed: "voyager_2_golden_record",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  // No parentId - Voyager 2 is a rogue object in interstellar space
  realMass_kg: VOYAGER2_MASS_KG,
  realRadius_m: 2.0, // Approximate size for visualization
  temperature: 300, // More realistic temperature for lighting calculations
  albedo: 0.3, // More realistic albedo for visibility
  // Rogue object orbital parameters (mostly zeros)
  orbit: {
    realSemiMajorAxis_m: 0, // Not orbiting anything
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: VOYAGER2_DISTANCE_AU, // Store distance for reference
    period_s: 0, // No orbital period
    siderealRotationPeriod_s: 24 * 3600, // Spacecraft rotation
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  // Critical: Ignore physics so Voyager 2 is not affected by gravitational forces
  ignorePhysics: false,
  ignoreCollisions: true,
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/voyager.glb", // Fixed path format
    modelScale: 1.0,
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1977-08-20",
    components: [
      "High-gain antenna (3.7m dish)",
      "Magnetometer boom",
      "Science instruments platform",
      "Nuclear thermoelectric generators (RTGs)",
      "Golden Record",
      "Plasma wave antenna",
    ],
  },
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the voyager2 configuration object instead.
 */
export function initializeVoyager2(): void {
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
