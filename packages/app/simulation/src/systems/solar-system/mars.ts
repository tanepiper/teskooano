import { DEG_TO_RAD } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type DesertSurfaceProperties,
  type RockyTerrestrialSurfaceProperties,
} from "@teskooano/data-types";

const MARS_MASS_KG = 6.4171e23;
const MARS_RADIUS_M = 3389500;
const MARS_TEMP_K = 210;
const MARS_ALBEDO = 0.17;
const MARS_SMA_AU = 1.523679;
const MARS_ECC = 0.093405;
const MARS_INC_DEG = 1.85061;
const MARS_LAN_DEG = 49.57854;
const MARS_AOP_DEG = 336.04084;
const MARS_MA_DEG = 355.45332;
const MARS_SIDEREAL_PERIOD_S = 5.9355e7;
const MARS_AXIAL_TILT_DEG = 25.19;

const PHOBOS_MASS_KG = 1.0659e16;
const PHOBOS_RADIUS_M = 11267;
const PHOBOS_SMA_M = 9376000;
const PHOBOS_ECC = 0.0151;
const PHOBOS_INC_DEG = 1.093;
const PHOBOS_SIDEREAL_PERIOD_S = 27553;
const PHOBOS_ALBEDO = 0.071;

const DEIMOS_MASS_KG = 1.4762e15;
const DEIMOS_RADIUS_M = 6200;
const DEIMOS_SMA_M = 23463200;
const DEIMOS_ECC = 0.00033;
const DEIMOS_INC_DEG = 0.93;
const DEIMOS_SIDEREAL_PERIOD_S = 109075;
const DEIMOS_ALBEDO = 0.068;

/**
 * Initializes Mars and its moons (Phobos, Deimos) using accurate data.
 */
export function initializeMars(parentId: string): void {
  const marsId = "mars";

  actions.addCelestial({
    id: marsId,
    name: "Mars",
    seed: "mars",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: MARS_MASS_KG,
    realRadius_m: MARS_RADIUS_M,
    visualScaleRadius: 0.53,
    temperature: MARS_TEMP_K,
    albedo: MARS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: MARS_SMA_AU * AU,
      eccentricity: MARS_ECC,
      inclination: MARS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MARS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MARS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MARS_MA_DEG * DEG_TO_RAD,
      period_s: MARS_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ["CO2", "N2", "Ar"],
      pressure: 0.006,
      color: "#FFB07A",
    },
    surface: {
      type: SurfaceType.DUNES,
      planetType: PlanetType.DESERT,
      color: "#C1440E",
      roughness: 0.6,
      secondaryColor: "#8B4513",
    } as DesertSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ["silicates", "iron oxide", "basalt"],
    },
  });

  actions.addCelestial({
    id: "phobos",
    name: "Phobos",
    type: CelestialType.MOON,
    parentId: marsId,
    realMass_kg: PHOBOS_MASS_KG,
    realRadius_m: PHOBOS_RADIUS_M,
    visualScaleRadius: 0.02,
    temperature: 233,
    albedo: PHOBOS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: PHOBOS_SMA_M,
      eccentricity: PHOBOS_ECC,
      inclination: PHOBOS_INC_DEG * DEG_TO_RAD,

      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: PHOBOS_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: "#00000000" },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: "#606060",
      roughness: 0.9,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: marsId,
      composition: ["carbonaceous chondrite"],
    },
  });

  actions.addCelestial({
    id: "deimos",
    name: "Deimos",
    type: CelestialType.MOON,
    parentId: marsId,
    realMass_kg: DEIMOS_MASS_KG,
    realRadius_m: DEIMOS_RADIUS_M,
    visualScaleRadius: 0.01,
    temperature: 233,
    albedo: DEIMOS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: DEIMOS_SMA_M,
      eccentricity: DEIMOS_ECC,
      inclination: DEIMOS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: DEIMOS_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: "#00000000" },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: "#808080",
      roughness: 0.6,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: marsId,
      composition: ["carbonaceous chondrite"],
    },
  });
}
