import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { factoryOperations } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const HIMALIA_MASS_KG = 6.74e18;
const HIMALIA_RADIUS_M = 85000;
const HIMALIA_SMA_M = 11439000 * KM;
const HIMALIA_ECC = 0.16;
const HIMALIA_INC_DEG = 28.4;
const HIMALIA_LAN_DEG = 64.2;
const HIMALIA_AOP_DEG = 321.1;
const HIMALIA_MA_DEG = 78.3;
const HIMALIA_SIDEREAL_PERIOD_S = 249.909 * 24 * 3600;
const HIMALIA_ALBEDO = 0.04;

/**
 * Initializes Himalia, Jupiter's largest irregular moon.
 */
export function initializeHimalia(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  factoryOperations.addCelestial({
    id: "himalia",
    name: "Himalia",
    seed: "himalia_seed_1904",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: HIMALIA_MASS_KG,
    realRadius_m: HIMALIA_RADIUS_M,
    temperature: 124, // Estimated
    albedo: HIMALIA_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: HIMALIA_SMA_M,
      eccentricity: HIMALIA_ECC,
      inclination: HIMALIA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: HIMALIA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: HIMALIA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: HIMALIA_MA_DEG * DEG_TO_RAD,
      period_s: HIMALIA_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: 0.324 * 24 * 3600, // ~7.78 hours
      axialTilt: defaultMoonAxialTilt,
    },
    physicsStateReal: {
      id: "himalia",
      mass_kg: HIMALIA_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["rock", "ice"],
      surface: {
        type: SurfaceType.CRATERED,
        color: "#9E9E9E",
        roughness: 0.9,
        classType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 2.5,
        octaves: 7,
        bumpScale: 0.8,
        color1: "#616161",
        color2: "#757575",
        color3: "#9E9E9E",
        color4: "#BDBDBD",
        color5: "#E0E0E0",
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.9,
        shininess: 3,
        specularStrength: 0.05,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.2,
        terrainType: 1,
        terrainAmplitude: 0.3,
        terrainSharpness: 1.8,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });
}
