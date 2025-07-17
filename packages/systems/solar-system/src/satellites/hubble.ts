import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";

// Hubble Space Telescope physical constants (current as of 2024)
const HUBBLE_MASS_KG = 11_110; // 11.1 tons
const HUBBLE_ALTITUDE_KM = 539; // Current average altitude (537-541 km range)
const HUBBLE_INCLINATION_DEG = 28.47;
const HUBBLE_PERIOD_MINUTES = 95.42;
const HUBBLE_ECCENTRICITY = 0.0001;

/**
 * Initializes the Hubble Space Telescope.
 * HST is one of the most important astronomical instruments ever built,
 * providing unprecedented views of the universe for over 35 years.
 */
export function initializeHubble(parentId: string): void {
  const altitudeM = HUBBLE_ALTITUDE_KM * KM;
  const earthRadiusM = 6.371e6; // Mean Earth radius
  const semiMajorAxisM = earthRadiusM + altitudeM;

  actions.addCelestial({
    id: "hubble",
    name: "Hubble Space Telescope",
    seed: "hst_great_observatory",
    type: CelestialType.SATELLITE,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: HUBBLE_MASS_KG,
    realRadius_m: 7, // Approximate radius for visualization (13.2m x 4.2m dimensions)
    temperature: 288, // ~15°C stable temperature
    albedo: 0.3, // Dark surfaces with some reflective components

    orbit: {
      realSemiMajorAxis_m: semiMajorAxisM,
      eccentricity: HUBBLE_ECCENTRICITY,
      inclination: HUBBLE_INCLINATION_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: 85.0 * DEG_TO_RAD,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: HUBBLE_PERIOD_MINUTES * 60,
      siderealRotationPeriod_s: HUBBLE_PERIOD_MINUTES * 60,
      axialTilt: new OSVector3(0, 1, 0).normalize(),
    },

    physicsStateReal: {
      id: "hubble",
      mass_kg: HUBBLE_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },

    properties: {
      type: CelestialType.SATELLITE,
      modelPath: "models/satellite/hubble.glb", // Fixed path format
      modelScale: 0.1, // Reduced from 0.7 to 0.4 for better size
      missionType: "scientific",
      operationalStatus: "active",
      launchDate: "1990-04-24",
      description:
        "NASA/ESA space telescope providing unprecedented views of the universe in visible, UV, and near-infrared light",
      components: [
        "2.4m primary mirror",
        "Scientific instruments",
        "Solar arrays",
        "Fine guidance sensors",
        "Pointing system",
      ],
    } as SatelliteProperties,
  });
}
