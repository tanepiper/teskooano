import { createOrbitalElementsFromTLE } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
  SatelliteProperties,
} from "@teskooano/data-types";

// Calculate orbital velocity directly for Earth satellite
// v = sqrt(GM/r) where GM = 3.986e14 m³/s² for Earth

const NOAA_19_TLE_LINE1 =
  "1 33591U 09005A   25202.60789824  .00000154  00000-0  10612-3 0  9993";
const NOAA_19_TLE_LINE2 =
  "2 33591  98.9954 267.5445 0012832 242.7448 117.2418 14.13391894847788";

export const noaa19: CelestialObject<SatelliteProperties> = {
  id: "noaa-19",
  name: "NOAA 19",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  realMass_kg: 2070,
  realRadius_m: 3,
  temperature: 285,
  albedo: 0.5,

  orbit: createOrbitalElementsFromTLE(NOAA_19_TLE_LINE1, NOAA_19_TLE_LINE2),
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
