import {
  type CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import { createOrbitalElements } from "@teskooano/core-physics";

export const hubble: CelestialObject<SatelliteProperties> = {
  id: "hubble",
  name: "Hubble Space Telescope",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  realMass_kg: 11110,
  realRadius_m: 7,
  temperature: 288,
  albedo: 0.3,

  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00027,
    eccentricity: 0,
    inclinationDeg: 28.47,
    longitudeOfAscendingNodeDeg: 85.0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 95.42 * 60,
    siderealRotationPeriod_s: 95.42 * 60,
    axialTiltDeg: 0,
  }),

  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/hubble.glb",
    modelScale: 0.05,
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1990-04-24",
    components: [
      "2.4m primary mirror",
      "Scientific instruments",
      "Solar arrays",
      "Fine guidance sensors",
      "Pointing system",
    ],
  },
};
