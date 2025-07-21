import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
  type CelestialObject,
} from "@teskooano/data-types";

export const jwst: CelestialObject<SatelliteProperties> = {
  id: "jwst",
  name: "James Webb Space Telescope",
  seed: "jwst_infrared_observatory",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",
  realMass_kg: 6_500,
  realRadius_m: 10,
  temperature: 300,
  albedo: 0.3,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00027,
    eccentricity: 0.0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 365.25 * 24 * 3600,
    siderealRotationPeriod_s: 365.25 * 24 * 3600,
    axialTiltDeg: 0,
    epoch: "J2000",
  }),
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/jwst.glb",
    modelScale: 1.2,
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "2021-12-25",
    components: [
      "6.5m segmented primary mirror",
      "Five-layer sunshield",
      "Infrared instruments",
      "Spacecraft bus",
      "High-gain antenna",
    ],
    materialProperties: {
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.5,
    },
  },
};
