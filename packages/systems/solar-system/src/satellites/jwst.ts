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
  parentId: "earth", // JWST orbits the Sun at the Earth-Sun L2 point
  lagrangePointTargetId: "earth", // The second body in the Sun-Earth system for L2 calculation
  realMass_kg: 6_500,
  realRadius_m: 10,
  temperature: 300,
  albedo: 0.3,
  orbit: createOrbitalElements({
    lagrangePointType: LagrangePointType.L2,
    parentMass_kg: SOLAR_MASS,
    targetMass_kg: EARTH_MASS,
    parentToTargetSeparation_m: AU / 10, // Earth's average distance from the Sun
    // Other orbital parameters will be derived from the Lagrange point calculation
    siderealRotationPeriod_s: 365.25 * 24 * 3600, // Roughly Earth's orbital period for rotation
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
