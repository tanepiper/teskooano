import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";

// ISS physical constants (current as of 2024)
const ISS_MASS_KG = 420_000; // ~420 tons
const ISS_ALTITUDE_KM = 415; // Current average altitude
const ISS_INCLINATION_DEG = 51.64;
const ISS_PERIOD_MINUTES = 92.88;
const ISS_ECCENTRICITY = 0.0003;

/**
 * Initializes the International Space Station.
 * The ISS is humanity's permanent outpost in space, serving as a scientific laboratory
 * and testing ground for future deep space missions.
 */
export function initializeISS(parentId: string): void {
  const altitudeM = ISS_ALTITUDE_KM * KM;
  const earthRadiusM = 6.371e6; // Mean Earth radius
  const semiMajorAxisM = earthRadiusM + altitudeM;

  actions.addCelestial({
    id: "iss",
    name: "International Space Station",
    seed: "iss_alpha_station",
    type: CelestialType.SATELLITE,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: ISS_MASS_KG,
    realRadius_m: 50, // Approximate radius for visualization (ISS is ~109m wide)
    temperature: 291, // ~18°C internal temperature
    albedo: 0.7, // Highly reflective solar panels

    orbit: {
      realSemiMajorAxis_m: semiMajorAxisM,
      eccentricity: ISS_ECCENTRICITY,
      inclination: ISS_INCLINATION_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: 173.0 * DEG_TO_RAD, // Current RAAN
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: ISS_PERIOD_MINUTES * 60,
      siderealRotationPeriod_s: ISS_PERIOD_MINUTES * 60, // Tidally locked orientation
      axialTilt: new OSVector3(0, 1, 0).normalize(),
    },

    physicsStateReal: {
      id: "iss",
      mass_kg: ISS_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },

    properties: {
      type: CelestialType.SATELLITE,
      modelPath: "/models/satellite/satellite.fbx",
      modelScale: 1.0,
      missionType: "scientific",
      operationalStatus: "active",
      launchDate: "1998-11-20", // First module (Zarya)
      description:
        "International collaborative space station serving as humanity's permanent outpost in low Earth orbit",
      components: [
        "Pressurized modules",
        "Solar arrays",
        "Truss structure",
        "Docking ports",
        "Robotic arms",
      ],
    } as SatelliteProperties,
  });
}
