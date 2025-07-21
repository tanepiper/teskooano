import {
  type CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import { createOrbitalElements } from "@teskooano/core-physics";

// Calculate orbital velocity directly for Earth satellite
// v = sqrt(GM/r) where GM = 3.986e14 m³/s² for Earth

export const gps: CelestialObject<SatelliteProperties> = {
  id: "gps-satellite",
  name: "GPS Satellite",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  realMass_kg: 2070,
  realRadius_m: 3,
  temperature: 285,
  albedo: 0.5,

  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00027,
    eccentricity: 0,
    inclinationDeg: 55.0,
    longitudeOfAscendingNodeDeg: 45.0,
    argumentOfPeriapsisDeg: 30.0,
    meanAnomalyDeg: 0,
    period_s: 11.967 * 3600,
    siderealRotationPeriod_s: 11.967 * 3600,
    axialTiltDeg: 0,
  }),

  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "./models/satellite/satellite.glb",
    modelScale: 1.0,
    missionType: "navigation",
    operationalStatus: "active",
    launchDate: "2018-12-23",
    components: [
      "Atomic clocks",
      "Navigation payload",
      "Solar arrays",
      "L-band antennas",
      "Search and rescue payload",
    ],
  },
};
