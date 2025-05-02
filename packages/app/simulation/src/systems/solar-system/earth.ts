import { DEG_TO_RAD } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  OceanSurfaceProperties,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type RockyTerrestrialSurfaceProperties,
} from "@teskooano/data-types";

const EARTH_MASS_KG = 5.97237e24;
const EARTH_RADIUS_M = 6371000;
const EARTH_TEMP_K = 288;
const EARTH_ALBEDO = 0.306;
const EARTH_SMA_AU = 1.0;
const EARTH_ECC = 0.01671;
const EARTH_INC_DEG = 0.00005;
const EARTH_LAN_DEG = -11.26064;
const EARTH_AOP_DEG = 102.94719;
const EARTH_MA_DEG = 100.46435;
const EARTH_SIDEREAL_PERIOD_S = 3.15581e7;
const EARTH_AXIAL_TILT_DEG = 23.43928;

const LUNA_MASS_KG = 7.342e22;
const LUNA_RADIUS_M = 1737400;
const LUNA_SMA_M = 384399000;
const LUNA_ECC = 0.0549;
const LUNA_INC_DEG = 5.145;
const LUNA_LAN_DEG = 125.08;
const LUNA_AOP_DEG = 318.15;
const LUNA_MA_DEG = 115.36;
const LUNA_SIDEREAL_PERIOD_S = 2.36059e6;
const LUNA_AXIAL_TILT_DEG = 6.687;
const LUNA_ALBEDO = 0.136;

/**
 * Initializes Earth and its Moon (Luna) using accurate data.
 */
export function initializeEarth(parentId: string): void {
  const earthId = "earth";

  actions.addCelestial({
    id: earthId,
    name: "Earth",
    seed: "earth",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: EARTH_MASS_KG,
    realRadius_m: EARTH_RADIUS_M,
    visualScaleRadius: 1.0,
    temperature: EARTH_TEMP_K,
    albedo: EARTH_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: EARTH_SMA_AU * AU,
      eccentricity: EARTH_ECC,
      inclination: EARTH_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: EARTH_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: EARTH_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: EARTH_MA_DEG * DEG_TO_RAD,
      period_s: EARTH_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ["N2", "O2", "Ar", "H2O", "CO2"],
      pressure: 1.013,
      color: "#87CEEB",
    },
    surface: {
      type: SurfaceType.OCEAN,
      planetType: PlanetType.OCEAN,
      color: "#1E90FF",
      oceanColor: "#1E90FF",
      deepOceanColor: "#00008B",
      landColor: "#228B22",
      landRatio: 0.29,
      waveHeight: 0.1,
      roughness: 0.4,
    } as OceanSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ["silicates", "iron core", "water"],
      axialTiltDeg: EARTH_AXIAL_TILT_DEG,
      seed: "earth_seed_36525",
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "luna",
    name: "Moon",
    type: CelestialType.MOON,
    seed: "luna",
    parentId: earthId,
    realMass_kg: LUNA_MASS_KG,
    realRadius_m: LUNA_RADIUS_M,
    visualScaleRadius: 0.27,
    temperature: 250,
    albedo: LUNA_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: LUNA_SMA_M,
      eccentricity: LUNA_ECC,
      inclination: LUNA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: LUNA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: LUNA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: LUNA_MA_DEG * DEG_TO_RAD,
      period_s: LUNA_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ["Ar", "He", "Na", "K"],
      pressure: 3e-15,
      color: "#CCCCCC00",
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: "#BEBEBE",
      roughness: 0.7,

      color1: "#BEBEBE",
      color2: "#A9A9A9",
      color3: "#D3D3D3",
      color4: "#808080",
      color5: "#E5E5E5",
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.1,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: earthId,
      composition: ["silicates", "anorthosite", "basalt"],
      axialTiltDeg: LUNA_AXIAL_TILT_DEG,
      seed: "luna_seed_2732",
    } as PlanetProperties,
  });
}
