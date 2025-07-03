import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  type OceanSurfaceProperties,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type RockyTerrestrialSurfaceProperties,
  type PlanetAtmosphereProperties,
} from "@teskooano/data-types";

const EARTH_MASS_KG = 5.97237e24;
const EARTH_RADIUS_M = 6371000;
const EARTH_TEMP_K = 288;
const EARTH_ALBEDO = 0.8;
const EARTH_SMA_AU = 1.0;
const EARTH_ECC = 0.01671;
const EARTH_INC_DEG = 0.00005;
const EARTH_LAN_DEG = -11.26064;
const EARTH_AOP_DEG = 102.94719;
const EARTH_MA_DEG = 100.46435;
const EARTH_ORBITAL_PERIOD_S = 3.15581e7;
const EARTH_SIDEREAL_ROTATION_PERIOD_S = 86164.1;
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
  const earthAxialTiltRad = EARTH_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: earthId,
    name: "Earth",
    seed: "earth",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: EARTH_MASS_KG,
    realRadius_m: EARTH_RADIUS_M,
    temperature: EARTH_TEMP_K,
    albedo: EARTH_ALBEDO,
    siderealRotationPeriod_s: EARTH_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(earthAxialTiltRad),
      Math.sin(earthAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: EARTH_SMA_AU * AU,
      eccentricity: EARTH_ECC,
      inclination: EARTH_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: EARTH_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: EARTH_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: EARTH_MA_DEG * DEG_TO_RAD,
      period_s: EARTH_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.TERRESTRIAL,
      isMoon: false,
      composition: [
        "silicates",
        "iron core",
        "liquid water",
        "nitrogen-oxygen atmosphere",
      ],
      atmosphere: {
        glowColor: "#87CEEB",
        intensity: 0.6,
        power: 1.2,
        thickness: 0.25,
      },
      surface: {
        type: SurfaceType.VARIED,
        color: "#15e267",
        roughness: 0.12,
        planetType: PlanetType.TERRESTRIAL,
        persistence: 0.54,
        lacunarity: 2.2,
        simplePeriod: 18,
        octaves: 9,
        bumpScale: 2.7,
        color1: "#1E3A5F",
        color2: "#3F7CAC",
        color3: "#8FBC8F",
        color4: "#9ACD32",
        color5: "#FFFAFA",
        height1: 0,
        height2: 0.09,
        height3: 0.26,
        height4: 0.4,
        height5: 0.67,
        shininess: 8.5,
        specularStrength: 0.32,
        ambientLightIntensity: 0.38,
        undulation: 0.8,
        terrainType: 3,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.7,
        terrainOffset: -0.5,
      },
    } as PlanetProperties,
  });

  const lunaAxialTiltRad = LUNA_AXIAL_TILT_DEG * DEG_TO_RAD;
  actions.addCelestial({
    id: "luna",
    name: "Moon",
    type: CelestialType.MOON,
    seed: "luna",
    parentId: earthId,
    realMass_kg: LUNA_MASS_KG,
    realRadius_m: LUNA_RADIUS_M,
    temperature: 250,
    albedo: LUNA_ALBEDO,
    siderealRotationPeriod_s: LUNA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(lunaAxialTiltRad),
      Math.sin(lunaAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: LUNA_SMA_M,
      eccentricity: LUNA_ECC,
      inclination: LUNA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: LUNA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: LUNA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: LUNA_MA_DEG * DEG_TO_RAD,
      period_s: LUNA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: earthId,
      composition: ["silicates", "anorthosite crust", "possible small core"],
      atmosphere: {
        glowColor: "#CCCCCC",
        intensity: 0.01,
        power: 0.5,
        thickness: 0.005,
      },
      surface: {
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ROCKY,
        color: "#BEBEBE",
        roughness: 0.75,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 6.0,
        octaves: 7,
        bumpScale: 0.15,
        color1: "#808080",
        color2: "#A9A9A9",
        color3: "#BEBEBE",
        color4: "#D3D3D3",
        color5: "#E0E0E0",
        height1: 0.0,
        height2: 0.3,
        height3: 0.55,
        height4: 0.75,
        height5: 1.0,
        shininess: 0.02,
        specularStrength: 0.02,
        ambientLightIntensity: 0.05,
        undulation: 0.1,
        terrainType: 1,
        terrainAmplitude: 0.35,
        terrainSharpness: 0.7,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
