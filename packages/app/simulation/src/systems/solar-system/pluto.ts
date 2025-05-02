import { DEG_TO_RAD } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  IceSurfaceProperties,
  PlanetType,
  SurfaceType,
} from "@teskooano/data-types";

const PLUTO_MASS_KG = 1.303e22;
const PLUTO_RADIUS_M = 1188300;
const PLUTO_TEMP_K = 44;
const PLUTO_ALBEDO = 0.58;
const PLUTO_SMA_AU = 39.482;
const PLUTO_ECC = 0.2488;
const PLUTO_INC_DEG = 17.16;
const PLUTO_LAN_DEG = 110.3;
const PLUTO_AOP_DEG = 224.07;
const PLUTO_MA_DEG = 238.93;
const PLUTO_SIDEREAL_PERIOD_S = 7.824e9;
const PLUTO_AXIAL_TILT_DEG = 119.59;

const CHARON_MASS_KG = 1.586e21;
const CHARON_RADIUS_M = 606000;
const CHARON_SMA_M = 19591.4 * KM;
const CHARON_ECC = 0.00005;
const CHARON_INC_DEG = 0.001;
const CHARON_SIDEREAL_PERIOD_S = 551855;
const CHARON_ALBEDO = 0.38;

/**
 * Initializes Pluto and its largest moon Charon using accurate data.
 */
export function initializePluto(parentId: string): void {
  const plutoId = "pluto";

  actions.addCelestial({
    id: plutoId,
    name: "Pluto",
    seed: "pluto",
    type: CelestialType.DWARF_PLANET,
    parentId: parentId,
    realMass_kg: PLUTO_MASS_KG,
    realRadius_m: PLUTO_RADIUS_M,
    visualScaleRadius: 0.18,
    temperature: PLUTO_TEMP_K,
    albedo: PLUTO_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: PLUTO_SMA_AU * AU,
      eccentricity: PLUTO_ECC,
      inclination: PLUTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PLUTO_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (PLUTO_AOP_DEG - PLUTO_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: PLUTO_MA_DEG * DEG_TO_RAD,
      period_s: PLUTO_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ["N2", "CH4", "CO"],
      pressure: 1e-5,
      color: "#E0FFFF80",
    },
    surface: {
      type: SurfaceType.ICE_FLATS,
      planetType: PlanetType.ICE,
      color: "#FFF8DC",
      secondaryColor: "#DAA520",
      roughness: 0.4,
      glossiness: 0.6,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.DWARF_PLANET,
      isMoon: false,
      composition: [
        "nitrogen ice",
        "water ice",
        "methane ice",
        "rock",
        "tholins",
      ],
    },
  });

  actions.addCelestial({
    id: "charon",
    name: "Charon",
    seed: "charon",
    type: CelestialType.MOON,
    parentId: plutoId,
    realMass_kg: CHARON_MASS_KG,
    realRadius_m: CHARON_RADIUS_M,
    visualScaleRadius: 0.09,
    temperature: 53,
    albedo: CHARON_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: CHARON_SMA_M,
      eccentricity: CHARON_ECC,
      inclination: CHARON_INC_DEG * DEG_TO_RAD,

      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: CHARON_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: "#00000000" },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ICE,
      color: "#B0B0B0",
      secondaryColor: "#8B4513",
      roughness: 0.6,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: plutoId,
      composition: ["water ice", "ammonia ice", "rock"],
    },
  });
}
