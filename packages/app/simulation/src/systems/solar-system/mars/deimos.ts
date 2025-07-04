import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

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
 * Initializes Deimos using accurate data.
 */
export function initializeDeimos(parentId: string): void {
  const deimosAxialTilt = new OSVector3(0, 1, 0);
  actions.addCelestial({
    id: "deimos",
    name: "Deimos",
    type: CelestialType.MOON,
    seed: "deimos",
    parentId: parentId,
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
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["carbonaceous chondrite"],
      shapeModel: "asteroid",
      atmosphere: undefined,
      surface: {
        type: SurfaceType.CRATERED,
        classType: PlanetType.ROCKY,
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
