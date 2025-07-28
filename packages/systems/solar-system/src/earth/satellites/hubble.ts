import {
  type CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import { createOrbitalElementsFromTLE } from "@teskooano/core-physics";

const HUBBLE_TLE_LINE1 =
  "1 20580U 90037B   25202.58856561  .00004350  00000-0  15814-3 0  9993";
const HUBBLE_TLE_LINE2 =
  "2 20580  28.4663 171.6779 0002194 111.0703 249.0126 15.25610022737941";

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

  orbit: createOrbitalElementsFromTLE(HUBBLE_TLE_LINE1, HUBBLE_TLE_LINE2),

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
