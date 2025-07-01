import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const IO_MASS_KG = 8.9319e22;
const IO_RADIUS_M = 1821600;
const IO_SMA_M = 421700 * KM;
const IO_ECC = 0.0041;
const IO_INC_DEG = 0.05;
const IO_LAN_DEG = 43.977;
const IO_AOP_DEG = 84.129;
const IO_MA_DEG = 342.021;
const IO_SIDEREAL_PERIOD_S = 152854;
const IO_ALBEDO = 0.63;

/**
 * Initializes Io, Jupiter's volcanically active moon.
 */
export function initializeIo(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "io",
    name: "Io",
    seed: "io_seed_1769",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: IO_MASS_KG,
    realRadius_m: IO_RADIUS_M,
    temperature: 110,
    albedo: IO_ALBEDO,
    siderealRotationPeriod_s: IO_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: IO_SMA_M,
      eccentricity: IO_ECC,
      inclination: IO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: IO_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: IO_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: IO_MA_DEG * DEG_TO_RAD,
      period_s: IO_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: [
        "sulfur compounds",
        "silicates",
        "iron core",
        "molten interior",
      ],
      atmosphere: {
        glowColor: "#FFFF00",
        intensity: 0.1,
        power: 0.8,
        thickness: 0.05,
      },
      surface: {
        type: SurfaceType.VOLCANIC,
        color: "#FFFFA0",
        roughness: 0.6,
        planetType: PlanetType.ROCKY,
        persistence: 0.58,
        lacunarity: 1.9,
        simplePeriod: 1.7,
        octaves: 8,
        bumpScale: 2.5,
        color1: "#FFFFA0",
        color2: "#FF6347",
        color3: "#FF2000",
        color4: "#8B4513",
        color5: "#201000",
        height1: 0.15,
        height2: 0.35,
        height3: 0.55,
        height4: 0.75,
        height5: 0.9,
        shininess: 18,
        specularStrength: 0.3,
        ambientLightIntensity: 0.25,
        undulation: 0.4,
        terrainType: 2,
        terrainAmplitude: 1.2,
        terrainSharpness: 1.8,
        terrainOffset: 0.2,
      },
    } as PlanetProperties,
  });
}