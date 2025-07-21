import {
  type CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import { createOrbitalElements } from "@teskooano/core-physics";

export const geostationarySat: CelestialObject<SatelliteProperties> = {
  id: "geostationary-comsat",
  name: "Geostationary CommSat",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  realMass_kg: 5500,
  realRadius_m: 10.0,
  temperature: 280,
  albedo: 0.6,

  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00027,
    eccentricity: 0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0.0,
    argumentOfPeriapsisDeg: 0.0,
    meanAnomalyDeg: 0,
    period_s: 86164.09054,
    siderealRotationPeriod_s: 86164.09054,
    axialTiltDeg: 0,
  }),

  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "./models/satellite/satellite.glb",
    modelScale: 1.0,
    missionType: "communications",
    operationalStatus: "active",
    launchDate: "2020-05-15",
    components: [
      "High-gain antennas",
      "Transponders",
      "Large solar arrays",
      "Reaction wheels",
      "Ion thrusters",
      "Communications payload",
    ],
  },
};
