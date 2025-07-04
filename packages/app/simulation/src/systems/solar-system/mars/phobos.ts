import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

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

/**
 * Initializes Phobos using accurate data.
 */
export function initializePhobos(parentId: string): void {
  const phobosAxialTilt = new OSVector3(0, 1, 0);
  actions.addCelestial({
    id: "phobos",
    name: "Phobos",
    type: CelestialType.MOON,
    seed: "phobos",
    parentId: parentId,
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
      parentPlanet: parentId,
      composition: ["carbonaceous chondrite"],
      shapeModel: "asteroid",
      atmosphere: undefined,
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
}
