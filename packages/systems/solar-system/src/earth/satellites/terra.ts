import { createOrbitalElementsFromTLE } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
  SatelliteProperties,
} from "@teskooano/data-types";

// Calculate orbital velocity directly for Earth satellite
// v = sqrt(GM/r) where GM = 3.986e14 m³/s² for Earth

const TERRA_TLE_LINE1 =
  "1 25994U 99068A   25202.63099410  .00000326  00000-0  75997-4 0  9996";
const TERRA_TLE_LINE2 =
  "2 25994  97.9961 259.4202 0002456 158.8579 317.0635 14.60737707361340";

export const terra: CelestialObject<SatelliteProperties> = {
  id: "terra",
  name: "TERRA",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  realMass_kg: 2070,
  realRadius_m: 3,
  temperature: 285,
  albedo: 0.5,

  orbit: createOrbitalElementsFromTLE(TERRA_TLE_LINE1, TERRA_TLE_LINE2),
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
