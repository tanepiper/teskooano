import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { celestialManager } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";

// Voyager 1 physical constants (real-time data as of latest update)
const VOYAGER1_MASS_KG = 815; // ~815 kg (including fuel)
const VOYAGER1_DISTANCE_AU = 167.66359913; // Current distance from Sun (real-time)
const VOYAGER1_DISTANCE_EARTH_AU = 166.98170765; // Current distance from Earth
const VOYAGER1_VELOCITY_KM_S = 17.0; // 38,026.77 mph = ~17.0 km/s relative to Sun
const MISSION_ELAPSED_TIME_YEARS = 47.85; // ~47 years, 10 months since launch

// Voyager 1's current position in space (constellation Ophiuchus)
// Right Ascension: ~17h 15m, Declination: ~+12°
const VOYAGER1_RA_DEG = 258.75; // 17h 15m = 17.25 * 15 = 258.75°
const VOYAGER1_DEC_DEG = 12.4; // +12.4°

/**
 * Initializes Voyager 1.
 * Launch: September 5, 1977
 * Current Status: 167.66 AU from Sun, traveling at 38,027 mph
 * Mission Elapsed Time: 47 years, 10 months, 9 days
 * The first human-made object to enter interstellar space, continuing its journey
 * through the cosmos carrying the Golden Record as a message to any extraterrestrial life.
 *
 * Uses rogue object approach - no orbital mechanics, direct position/velocity.
 */
export function initializeVoyager1(): void {
  const distanceM = VOYAGER1_DISTANCE_AU * AU;
  const velocityMs = VOYAGER1_VELOCITY_KM_S * 1000;

  // Calculate Voyager 1's actual position in 3D space based on astronomical coordinates
  // Convert RA/Dec to Cartesian coordinates
  const raRad = VOYAGER1_RA_DEG * DEG_TO_RAD;
  const decRad = VOYAGER1_DEC_DEG * DEG_TO_RAD;

  const position = new OSVector3(
    distanceM * Math.cos(decRad) * Math.cos(raRad),
    distanceM * Math.sin(decRad),
    distanceM * Math.cos(decRad) * Math.sin(raRad),
  );

  // Voyager 1's actual velocity vector is not purely radial due to gravitational assists
  // It has both radial (away from Sun) and tangential components
  // Current trajectory: roughly toward constellation Ophiuchus/Serpentarius
  // Approximate velocity components based on actual trajectory
  const radialComponent = position
    .normalize()
    .multiplyScalar(velocityMs * 0.85); // 85% radial
  const tangentialComponent = new OSVector3(
    -radialComponent.z * 0.53, // Tangential perpendicular to radial
    radialComponent.y * 0.1, // Small Y component
    radialComponent.x * 0.53, // Tangential component
  );
  const velocity = radialComponent.add(tangentialComponent);

  const voyager1Properties: SatelliteProperties = {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/voyager.glb", // Fixed path format
    modelScale: 1.0,
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1977-09-05",
    description:
      "NASA's Voyager 1 - the most distant human-made object and first to enter interstellar space. Currently 167.66 AU from Sun (15.5 billion miles), traveling at 38,027 mph. Mission elapsed time: 47 years, 10 months. One-way light time: 23:08:44. Carries the Golden Record with sounds and images of Earth for potential extraterrestrial discovery.",
    components: [
      "High-gain antenna (3.7m dish)",
      "Magnetometer boom",
      "Science instruments platform",
      "Nuclear thermoelectric generators (RTGs)",
      "Golden Record",
      "Plasma wave antenna",
    ],
  } as SatelliteProperties;

  celestialManager.addCelestial({
    id: "voyager-1",
    name: "Voyager 1",
    seed: "voyager_1_golden_record",
    type: CelestialType.SATELLITE,
    status: CelestialStatus.ACTIVE,
    // No parentId - Voyager 1 is a rogue object in interstellar space
    realMass_kg: VOYAGER1_MASS_KG,
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
      meanAnomaly: VOYAGER1_DISTANCE_AU, // Store distance for reference
      period_s: 0, // No orbital period
      siderealRotationPeriod_s: 24 * 3600, // Spacecraft rotation
      axialTilt: new OSVector3(0, 1, 0).normalize(),
    },

    // Critical: Ignore physics so Voyager 1 is not affected by gravitational forces
    ignorePhysics: false,
    ignoreCollisions: true,

    properties: voyager1Properties,
  });
}
