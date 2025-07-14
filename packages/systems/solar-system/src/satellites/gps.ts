import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";

// GPS satellite physical constants
const GPS_MASS_KG = 2_070; // ~2 tons (GPS Block III)
const GPS_ALTITUDE_KM = 20_200; // Medium Earth Orbit
const GPS_INCLINATION_DEG = 55.0; // GPS constellation inclination
const GPS_PERIOD_HOURS = 11.967; // ~12 hours (sidereal)
const GPS_ECCENTRICITY = 0.02;

/**
 * Initializes a representative GPS satellite.
 * GPS satellites form a constellation providing global navigation services
 * from Medium Earth Orbit.
 */
export function initializeGPS(parentId: string): void {
  const altitudeM = GPS_ALTITUDE_KM * KM;
  const earthRadiusM = 6.371e6; // Mean Earth radius
  const semiMajorAxisM = earthRadiusM + altitudeM;

  actions.addCelestial({
    id: "gps-satellite",
    name: "GPS Satellite",
    seed: "gps_navstar_block3",
    type: CelestialType.SATELLITE,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: GPS_MASS_KG,
    realRadius_m: 3, // Approximate radius for visualization
    temperature: 285, // Stable operating temperature
    albedo: 0.5, // Moderate reflectivity

    orbit: {
      realSemiMajorAxis_m: semiMajorAxisM,
      eccentricity: GPS_ECCENTRICITY,
      inclination: GPS_INCLINATION_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: 45.0 * DEG_TO_RAD,
      argumentOfPeriapsis: 30.0 * DEG_TO_RAD,
      meanAnomaly: 0,
      period_s: GPS_PERIOD_HOURS * 3600,
      siderealRotationPeriod_s: GPS_PERIOD_HOURS * 3600,
      axialTilt: new OSVector3(0, 1, 0).normalize(),
    },

    physicsStateReal: {
      id: "gps-satellite",
      mass_kg: GPS_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },

    properties: {
      type: CelestialType.SATELLITE,
      modelPath: "/models/satellite/satellite.fbx",
      modelScale: 0.8,
      missionType: "navigation",
      operationalStatus: "active",
      launchDate: "2018-12-23", // Representative Block III launch
      description:
        "Global Positioning System satellite providing precise navigation signals worldwide",
      components: [
        "Atomic clocks",
        "Navigation payload",
        "Solar arrays",
        "L-band antennas",
        "Search and rescue payload",
      ],
    } as SatelliteProperties,
  });
}
