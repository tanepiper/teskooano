import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
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
 * ISS configuration object for modular solar system initialization.
 */
export const iss = {
  id: "iss",
  name: "International Space Station",
  seed: "iss_alpha_station",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth", // Will be replaced during initialization
  realMass_kg: ISS_MASS_KG,
  realRadius_m: 50, // Approximate radius for visualization (ISS is ~109m wide)
  temperature: 291, // ~18°C internal temperature
  albedo: 0.7, // Highly reflective solar panels
  orbit: {
    realSemiMajorAxis_m: 6.371e6 + ISS_ALTITUDE_KM * KM, // Earth radius + altitude
    eccentricity: ISS_ECCENTRICITY,
    inclination: ISS_INCLINATION_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: 173.0 * DEG_TO_RAD, // Current RAAN
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: ISS_PERIOD_MINUTES * 60,
    siderealRotationPeriod_s: ISS_PERIOD_MINUTES * 60, // Tidally locked orientation
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "./models/satellite/iss.glb", // Changed from absolute to relative path
    modelScale: 2.0,
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
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the iss configuration object instead.
 */
export function initializeISS(parentId: string): void {
  const issConfig = { ...iss, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
