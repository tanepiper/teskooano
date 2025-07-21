import {
  CelestialObject,
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
} from "@teskooano/data-types";
import { createOrbitalElementsFromTLE } from "@teskooano/core-physics";
import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";

// ISS TLE data (ZARYA) - Epoch: 20/07/2025 20:20:32 UTC
const ISS_TLE_LINE1 =
  "1 25544U 98067A   25201.84759595  .00007915  00000-0  14663-3 0  9997";
const ISS_TLE_LINE2 =
  "2 25544  51.6338 140.2277 0002187  99.1799 260.9438 15.49977817520381";

// ISS physical properties
const ISS_MASS_KG = 419725; // ~420 metric tons
const ISS_RADIUS_M = 109; // Maximum dimension
const ISS_TEMP_K = 288; // ~15°C stable temperature
const ISS_ALBEDO = 0.3; // Dark surfaces with some reflective components // ~7660 m/s

export const iss: CelestialObject<SatelliteProperties> = {
  id: "iss",
  name: "International Space Station",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  parentId: "earth",

  // Physical properties
  realMass_kg: ISS_MASS_KG,
  realRadius_m: ISS_RADIUS_M,
  temperature: ISS_TEMP_K,
  albedo: ISS_ALBEDO,
  // Orbital elements from TLE data (Earth-relative)
  orbit: createOrbitalElementsFromTLE(ISS_TLE_LINE1, ISS_TLE_LINE2),

  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/iss.glb", // Fixed path format
    modelScale: 1, // Reduced from 0.7 to 0.4 for better size
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
