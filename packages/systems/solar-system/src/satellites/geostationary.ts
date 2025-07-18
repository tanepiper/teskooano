import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { factoryOperations } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";

// Geostationary satellite physical constants (exact physics)
const GEOSAT_MASS_KG = 5_500; // ~5.5 tons (typical large communications satellite)
const GEOSTATIONARY_SEMI_MAJOR_AXIS_KM = 42_164; // From physics: r = ∛(μT²/4π²)
const SIDEREAL_DAY_SECONDS = 86164.09054; // Exact sidereal day from physics
const EARTH_AXIAL_TILT_DEG = 23.4392811; // Must match Earth's axial tilt exactly
const GEOSTATIONARY_ECCENTRICITY = 0.0; // Must be exactly circular

/**
 * Initializes a geostationary communications satellite that stays fixed
 * above a point on Earth's surface by orbiting in Earth's equatorial plane
 * @param parentId - ID of Earth to orbit around
 */
export function initializeGeostationarySat(parentId: string): void {
  const semiMajorAxisM = GEOSTATIONARY_SEMI_MAJOR_AXIS_KM * KM;

  factoryOperations.addCelestial({
    id: "geostationary-comsat",
    name: "Geostationary CommSat",
    seed: "geostationary_communications_satellite",
    type: CelestialType.SATELLITE,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: GEOSAT_MASS_KG,
    realRadius_m: 10.0, // Larger communications satellite
    temperature: 280, // Stable operating temperature
    albedo: 0.6, // Higher reflectivity (large solar arrays)

    orbit: {
      realSemiMajorAxis_m: semiMajorAxisM, // 42,164 km from Earth's center (physics-derived)
      eccentricity: GEOSTATIONARY_ECCENTRICITY, // Exactly 0 (circular)
      inclination: EARTH_AXIAL_TILT_DEG * DEG_TO_RAD, // KEY FIX: Match Earth's axial tilt
      longitudeOfAscendingNode: 0.0 * DEG_TO_RAD, // Above 0° longitude
      argumentOfPeriapsis: 0.0 * DEG_TO_RAD, // Undefined for circular orbit, but set to 0
      meanAnomaly: 0,
      // CRITICAL: Must exactly match Earth's sidereal rotation period
      period_s: SIDEREAL_DAY_SECONDS, // 86164.09054 s (exact sidereal day)
      siderealRotationPeriod_s: SIDEREAL_DAY_SECONDS,
      axialTilt: new OSVector3(0, 1, 0).normalize(), // Standard axial orientation
    },

    physicsStateReal: {
      id: "geostationary-comsat",
      mass_kg: GEOSAT_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },

    properties: {
      type: CelestialType.SATELLITE,
      modelPath: "./models/satellite/satellite.glb",
      modelScale: 1.0, // Larger scale for bigger satellite
      missionType: "communications",
      operationalStatus: "active",
      launchDate: "2020-05-15", // Representative modern comsat
      description:
        "Geostationary communications satellite. Period: 86164.09054s, radius: 42,164km, orbits in Earth's equatorial plane (inclination: 23.44°) to stay fixed above Earth's surface.",
      components: [
        "High-gain antennas",
        "Transponders",
        "Large solar arrays",
        "Reaction wheels",
        "Ion thrusters",
        "Communications payload",
      ],
    } as SatelliteProperties,
  });
}
