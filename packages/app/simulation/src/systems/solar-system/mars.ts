import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type DesertSurfaceProperties,
  type RockyTerrestrialSurfaceProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
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
const MARS_ORBITAL_PERIOD_S = 5.9355e7;
const MARS_SIDEREAL_ROTATION_PERIOD_S = 88642.66;
const MARS_AXIAL_TILT_DEG = 25.19;

const PHOBOS_MASS_KG = 1.0659e16;
const PHOBOS_RADIUS_M = 11267;
const PHOBOS_SMA_M = 9375000;
const PHOBOS_ECC = 0.015;
const PHOBOS_INC_DEG = 1.1;
const PHOBOS_LAN_DEG = 169.2;
const PHOBOS_AOP_DEG = 216.3;
const PHOBOS_MA_DEG = 189.7;
const PHOBOS_SIDEREAL_PERIOD_S = 27537;
const PHOBOS_ALBEDO = 0.071;

const DEIMOS_MASS_KG = 1.4762e15;
const DEIMOS_RADIUS_M = 6200;
const DEIMOS_SMA_M = 23457000;
const DEIMOS_ECC = 0.0;
const DEIMOS_INC_DEG = 1.8;
const DEIMOS_LAN_DEG = 54.3;
const DEIMOS_AOP_DEG = 0.0;
const DEIMOS_MA_DEG = 205.0;
const DEIMOS_SIDEREAL_PERIOD_S = 109080;
const DEIMOS_ALBEDO = 0.068;

/**
 * Initializes Mars and its moons (Phobos, Deimos) using accurate data.
 */
export function initializeMars(parentId: string): void {
  const marsId = "mars";
  const marsAxialTiltRad = MARS_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: marsId,
    name: "Mars",
    seed: "mars",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: MARS_MASS_KG,
    realRadius_m: MARS_RADIUS_M,
    temperature: MARS_TEMP_K,
    albedo: MARS_ALBEDO,
    siderealRotationPeriod_s: MARS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(marsAxialTiltRad),
      Math.sin(marsAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: MARS_SMA_AU * AU,
      eccentricity: MARS_ECC,
      inclination: MARS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MARS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MARS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MARS_MA_DEG * DEG_TO_RAD,
      period_s: MARS_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.ROCKY,
      isMoon: false,
      composition: ["iron oxide", "silicates", "thin CO2 atmosphere"],
      atmosphere: {
        glowColor: "#CD853F",
        intensity: 0.2,
        power: 1.1,
        thickness: 0.1,
      },
      surface: {
        type: SurfaceType.DUNES,
        color: "#CD853F",
        roughness: 0.8,
        planetType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 2.5,
        octaves: 10,
        bumpScale: 0.025,
        color1: "#C2B280",
        color2: "#CD853F",
        color3: "#8B4513",
        color4: "#D2691E",
        color5: "#FFF8DC",
        height1: 0.05,
        height2: 0.12,
        height3: 0.28,
        height4: 0.65,
        height5: 0.95,
        shininess: 12,
        specularStrength: 0.1,
        ambientLightIntensity: 0.4,
        undulation: 0.2,
        terrainType: 3,
        terrainAmplitude: 0.45,
        terrainSharpness: 0.65,
        terrainOffset: 0.2,
      },
    } as PlanetProperties,
  });

  const phobosAxialTilt = new OSVector3(0, 1, 0);
  actions.addCelestial({
    id: "phobos",
    name: "Phobos",
    type: CelestialType.MOON,
    seed: "phobos",
    parentId: marsId,
    realMass_kg: PHOBOS_MASS_KG,
    realRadius_m: PHOBOS_RADIUS_M,
    temperature: 233,
    albedo: PHOBOS_ALBEDO,
    siderealRotationPeriod_s: PHOBOS_SIDEREAL_PERIOD_S,
    axialTilt: phobosAxialTilt,
    orbit: {
      realSemiMajorAxis_m: PHOBOS_SMA_M,
      eccentricity: PHOBOS_ECC,
      inclination: PHOBOS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PHOBOS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: PHOBOS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: PHOBOS_MA_DEG * DEG_TO_RAD,
      period_s: PHOBOS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: marsId,
      composition: ["carbonaceous chondrite"],
      shapeModel: "asteroid",
      atmosphere: {
        glowColor: "#000000",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ROCKY,
        color: "#606060",
        roughness: 0.9,
        persistence: 0.4,
        lacunarity: 2.0,
        simplePeriod: 3.0,
        octaves: 5,
        bumpScale: 0.2,
        color1: "#404040",
        color2: "#505050",
        color3: "#606060",
        color4: "#707070",
        color5: "#808080",
        height1: 0.0,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 1.0,
        shininess: 0.01,
        specularStrength: 0.01,
        ambientLightIntensity: 0.02,
        undulation: 0.3,
        terrainType: 1,
        terrainAmplitude: 0.5,
        terrainSharpness: 0.8,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });

  const deimosAxialTilt = new OSVector3(0, 1, 0);
  actions.addCelestial({
    id: "deimos",
    name: "Deimos",
    type: CelestialType.MOON,
    seed: "deimos",
    parentId: marsId,
    realMass_kg: DEIMOS_MASS_KG,
    realRadius_m: DEIMOS_RADIUS_M,
    temperature: 233,
    albedo: DEIMOS_ALBEDO,
    siderealRotationPeriod_s: DEIMOS_SIDEREAL_PERIOD_S,
    axialTilt: deimosAxialTilt,
    orbit: {
      realSemiMajorAxis_m: DEIMOS_SMA_M,
      eccentricity: DEIMOS_ECC,
      inclination: DEIMOS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: DEIMOS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: DEIMOS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: DEIMOS_MA_DEG * DEG_TO_RAD,
      period_s: DEIMOS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: marsId,
      composition: ["carbonaceous chondrite"],
      shapeModel: "asteroid",
      atmosphere: {
        glowColor: "#000000",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ROCKY,
        color: "#808080",
        roughness: 0.6,
        persistence: 0.45,
        lacunarity: 2.1,
        simplePeriod: 4.0,
        octaves: 5,
        bumpScale: 0.15,
        color1: "#606060",
        color2: "#707070",
        color3: "#808080",
        color4: "#909090",
        color5: "#A0A0A0",
        height1: 0.0,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 1.0,
        shininess: 0.01,
        specularStrength: 0.01,
        ambientLightIntensity: 0.03,
        undulation: 0.2,
        terrainType: 1,
        terrainAmplitude: 0.3,
        terrainSharpness: 0.6,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
