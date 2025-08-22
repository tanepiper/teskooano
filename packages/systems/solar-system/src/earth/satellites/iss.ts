import { createOrbitalElementsFromTLE } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
  SatelliteProperties,
} from "@teskooano/data-types";

const ISS_TLE_LINE1 =
  "1 25544U 98067A   25201.84759595  .00007915  00000-0  14663-3 0  9997";
const ISS_TLE_LINE2 =
  "2 25544  51.6338 140.2277 0002187  99.1799 260.9438 15.49977817520381";

export const iss: CelestialObject<SatelliteProperties> = {
  id: "iss",
  name: "International Space Station",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",
  realMass_kg: 419725,
  realRadius_m: 109,
  temperature: 288,
  albedo: 0.3,
  orbit: createOrbitalElementsFromTLE(ISS_TLE_LINE1, ISS_TLE_LINE2),
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/iss.glb",
    modelScale: 1,
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1998-11-20",
    components: [
      "2.4m primary mirror",
      "Scientific instruments",
      "Solar arrays",
      "Communication systems",
    ],
  },
};
