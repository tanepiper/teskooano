import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
  type CelestialObject,
  LagrangePointType,
} from "@teskooano/data-types";
import { SOLAR_MASS, EARTH_MASS, AU } from "@teskooano/core-physics";

export const jwst: CelestialObject<SatelliteProperties> = {
  id: "jwst",
  name: "James Webb Space Telescope",
  seed: "jwst_infrared_observatory",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // JWST orbits the Sun at the Earth-Sun L2 point
  lagrangePointTargetId: "earth", // The second body in the Sun-Earth system for L2 calculation
  realMass_kg: 6_500,
  realRadius_m: 10,
  temperature: 300,
  albedo: 0.3,
  orbit: createOrbitalElements({
    lagrangePointType: LagrangePointType.L2,
    semiMajorAxisAU: 1.0, // Nominal, will be overridden by LagrangeProcessor
    eccentricity: 0.0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 365.25 * 24 * 3600, // Nominal, roughly Earth's orbital period
    siderealRotationPeriod_s: 365.25 * 24 * 3600,
    axialTiltDeg: 0,
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
