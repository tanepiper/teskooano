import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
} from "@teskooano/data-types";

const PHOBOS_MASS_KG = 1.072e16;
const PHOBOS_RADIUS_M = 11100;
const PHOBOS_SMA_M = 9378 * KM;
const PHOBOS_ECC = 0.0151;
const PHOBOS_INC_DEG = 1.082;
const PHOBOS_SIDEREAL_PERIOD_S = 27554;
const PHOBOS_ALBEDO = 0.071;
const PHOBOS_LAN_DEG = 16.946;
const PHOBOS_AOP_DEG = 157.116;
const PHOBOS_MA_DEG = 290.132;

const DEIMOS_MASS_KG = 1.476e15;
const DEIMOS_RADIUS_M = 6200;
const DEIMOS_SMA_M = 23459 * KM;
const DEIMOS_ECC = 0.0005;
const DEIMOS_INC_DEG = 1.793;
const DEIMOS_SIDEREAL_PERIOD_S = 109123;
const DEIMOS_ALBEDO = 0.0068;
const DEIMOS_LAN_DEG = 47.402;
const DEIMOS_AOP_DEG = 285.131;
const DEIMOS_MA_DEG = 243.577;

/**
 * Initializes Mars' moons Phobos and Deimos.
 */
export function initializeMarsMoons(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0); // Assuming tidally locked or default axial tilt

  const phobosProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.0,
    simplePeriod: 3.0,
    octaves: 5,
    bumpScale: 0.35,
    color1: "#3E2723",
    color2: "#4E342E",
    color3: "#5D4037",
    color4: "#6D4C41",
    color5: "#795548",
    height1: 0.0,
    height2: 0.25,
    height3: 0.5,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.02,
    specularStrength: 0.01,
    roughness: 0.9,
    ambientLightIntensity: 0.05,
    undulation: 0.2,
    terrainType: 1,
    terrainAmplitude: 0.4,
    terrainSharpness: 0.8,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "phobos",
    name: "Phobos",
    seed: "phobos",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: PHOBOS_MASS_KG,
    realRadius_m: PHOBOS_RADIUS_M,
    temperature: 200, // Simplified temperature
    albedo: PHOBOS_ALBEDO,
    siderealRotationPeriod_s: PHOBOS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt, // Phobos is nearly tidally locked
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
      planetType: PlanetType.ROCKY_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["carbonaceous chondrite material"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          ...phobosProceduralSurface,
          planetType: PlanetType.ROCKY_WORLD,
        },
      },
    } as PlanetProperties,
  });

  const deimosProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.0,
    simplePeriod: 3.0,
    octaves: 5,
    bumpScale: 0.3,
    color1: "#424242",
    color2: "#525252",
    color3: "#616161",
    color4: "#757575",
    color5: "#9E9E9E",
    height1: 0.0,
    height2: 0.25,
    height3: 0.5,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.03,
    specularStrength: 0.02,
    roughness: 0.85,
    ambientLightIntensity: 0.05,
    undulation: 0.15,
    terrainType: 1,
    terrainAmplitude: 0.35,
    terrainSharpness: 0.75,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "deimos",
    name: "Deimos",
    seed: "deimos",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: DEIMOS_MASS_KG,
    realRadius_m: DEIMOS_RADIUS_M,
    temperature: 190, // Simplified temperature
    albedo: DEIMOS_ALBEDO,
    siderealRotationPeriod_s: DEIMOS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt, // Deimos is nearly tidally locked
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
      planetType: PlanetType.ROCKY_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["carbonaceous material"],
      surface: {
        surfaceType: SurfaceType.SMOOTH_PLAINS, // Deimos is smoother than Phobos
        proceduralData: {
          ...deimosProceduralSurface,
          planetType: PlanetType.ROCKY_WORLD,
        },
      },
    } as PlanetProperties,
  });
}
