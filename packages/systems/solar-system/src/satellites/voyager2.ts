import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { factoryOperations } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
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
 * Initializes Voyager 2.
 * Launch: August 20, 1977 (launched before Voyager 1)
 * Current Status: 140.23 AU from Sun, traveling at 34,391 mph
 * Mission Elapsed Time: 47 years, 10 months, 24 days
 * The second human-made object to enter interstellar space, the only spacecraft
 * to visit all four gas giant planets. Also carries the Golden Record.
 *
 * Uses rogue object approach - no orbital mechanics, direct position/velocity.
 */
export function initializeVoyager2(): void {
  const distanceM = VOYAGER2_DISTANCE_AU * AU;
  const velocityMs = VOYAGER2_VELOCITY_KM_S * 1000;

  // Calculate Voyager 2's actual position in 3D space based on astronomical coordinates
  // Convert RA/Dec to Cartesian coordinates
  const raRad = VOYAGER2_RA_DEG * DEG_TO_RAD;
  const decRad = VOYAGER2_DEC_DEG * DEG_TO_RAD;

  const position = new OSVector3(
    distanceM * Math.cos(decRad) * Math.cos(raRad),
    distanceM * Math.sin(decRad),
    distanceM * Math.cos(decRad) * Math.sin(raRad),
  );

  // Voyager 2's actual velocity vector is not purely radial due to gravitational assists
  // It has both radial (away from Sun) and tangential components
  // Current trajectory: roughly toward constellation Pavo/Telescopium (different from Voyager 1)
  // Approximate velocity components based on actual trajectory
  const radialComponent = position
    .normalize()
    .multiplyScalar(velocityMs * 0.82); // 82% radial
  const tangentialComponent = new OSVector3(
    radialComponent.z * 0.47, // Tangential perpendicular to radial
    -radialComponent.y * 0.15, // Small negative Y component
    -radialComponent.x * 0.47, // Tangential component
  );
  const velocity = radialComponent.add(tangentialComponent);

  const voyager2Properties: SatelliteProperties = {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/voyager.glb", // Fixed path format
    modelScale: 1.0,
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1977-08-20",
    description:
      "NASA's Voyager 2 - the only spacecraft to visit all four outer planets. Currently 139.7 AU from Sun (13 billion miles), traveling at 34,390 mph. Mission elapsed time: 47 years, 1 month. One-way light time: 19:20:00. Carries the Golden Record with sounds and images of Earth for potential extraterrestrial discovery.",
    components: [
      "High-gain antenna (3.7m dish)",
      "Magnetometer boom",
      "Science instruments platform",
      "Nuclear thermoelectric generators (RTGs)",
      "Golden Record",
      "Plasma wave antenna",
    ],
  } as SatelliteProperties;

  factoryOperations.addCelestial({
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

    // Direct physics state - rogue object approach
    physicsStateReal: {
      id: "voyager-2",
      mass_kg: VOYAGER2_MASS_KG,
      position_m: position, // Real position in interstellar space
      velocity_mps: velocity, // Real velocity vector
    },

    // Critical: Ignore physics so Voyager 2 is not affected by gravitational forces
    ignorePhysics: false,
    ignoreCollisions: true,

    properties: voyager2Properties,
  });
}
