import {
  CelestialType,
  StellarType,
  CelestialStatus,
  type StarProperties,
  type CelestialObject,
} from "@teskooano/data-types";
import { createOrbitalElements, kmToM } from "@teskooano/core-physics";

/**
 * Sun configuration object for modular solar system initialization.
 * Data primarily sourced from NASA Planetary Fact Sheet & JPL Horizons.
 */
export const sun: CelestialObject<StarProperties> = {
  id: "sun",
  name: "Sun",
  seed: "sun_seed_string_111",
  type: CelestialType.STAR,
  status: CelestialStatus.ACTIVE,
  parentId: undefined, // Sun has no parent
  realMass_kg: 1.9885e30,
  realRadius_m: kmToM(696340),
  temperature: 5778,
  albedo: 0.3,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0, // Sun is at the center of the system
    eccentricity: 0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 0, // Zero period indicates stationary central body
    siderealRotationPeriod_s: 25.05 * 24 * 3600, // Solar rotation period (~25 days)
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: "G2V",
    luminosity: 1.0,
    color: "#FFFFE0",
    stellarType: StellarType.MAIN_SEQUENCE,
  },
};
