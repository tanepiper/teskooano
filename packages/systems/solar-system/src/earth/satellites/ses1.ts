import {
  type CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import {
  createOrbitalElements,
  createOrbitalElementsFromTLE,
} from "@teskooano/core-physics";

const GEOSTATIONARY_TLE_LINE1 =
  "1 36516U 10016A   25202.56989238 -.00000117  00000-0  00000-0 0  9990";
const GEOSTATIONARY_TLE_LINE2 =
  "2 36516   0.0515 278.7844 0002289 202.9903 281.9420  1.00271659 55715";

export const ses1: CelestialObject<SatelliteProperties> = {
  id: "ses-1",
  name: "SES 1",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  realMass_kg: 5500,
  realRadius_m: 10.0,
  temperature: 280,
  albedo: 0.6,

  orbit: createOrbitalElementsFromTLE(
    GEOSTATIONARY_TLE_LINE1,
    GEOSTATIONARY_TLE_LINE2,
  ),

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
