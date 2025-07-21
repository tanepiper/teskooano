import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
  type CelestialObject,
} from "@teskooano/data-types";

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
export const voyager2: CelestialObject<SatelliteProperties> = {
  id: "voyager-2",
  name: "Voyager 2",
  seed: "voyager_2_golden_record",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  // No parentId - Voyager 2 is a rogue object in interstellar space
  realMass_kg: 815,
  realRadius_m: 2.0,
  temperature: 300,
  albedo: 0.3, // More realistic albedo for visibility
  // Rogue object orbital parameters (mostly zeros)
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0, // Not orbiting anything
    eccentricity: 0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 0,
    siderealRotationPeriod_s: 24 * 3600,
    axialTiltDeg: 0,
  }),
  ignorePhysics: false,
  ignoreCollisions: true,
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/voyager.glb",
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
