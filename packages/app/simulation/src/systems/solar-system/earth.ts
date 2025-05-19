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
const EARTH_ALBEDO = 0.306;
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
    atmosphere: {
      glowColor: "#87CEEB",
      intensity: 0.6,
      power: 1.2,
      thickness: 0.25,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.OCEAN,
      planetType: PlanetType.OCEAN,
      color: "#1E90FF",
      roughness: 0.3,
      oceanColor: "#3A79FF",
      deepOceanColor: "#003B8F",
      landColor: "#558B2F",
      landRatio: 0.29,
      waveHeight: 0.05,
      oceanDepth: 3.5,
    } as OceanSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.OCEAN,
      isMoon: false,
      composition: [
        "silicates",
        "iron core",
        "liquid water",
        "nitrogen-oxygen atmosphere",
      ],
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
    atmosphere: {
      glowColor: "#CCCCCC08",
      intensity: 0.01,
      power: 0.5,
      thickness: 0.005,
    } as PlanetAtmosphereProperties,
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
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: earthId,
      composition: ["silicates", "anorthosite crust", "possible small core"],
    } as PlanetProperties,
  });
}
