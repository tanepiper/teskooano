import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const THEBE_MASS_KG = 4.3e17;
const THEBE_RADIUS_M = 49300;
const THEBE_SMA_M = 222000 * KM;
const THEBE_ECC = 0.0175;
const THEBE_INC_DEG = 1.076;
const THEBE_SIDEREAL_PERIOD_S = 58275;
const THEBE_ALBEDO = 0.047;

/**
 * Initializes Thebe, one of Jupiter's inner moons.
 */
export function initializeThebe(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "thebe",
    name: "Thebe",
    seed: "thebe_seed_2024",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: THEBE_MASS_KG,
    realRadius_m: THEBE_RADIUS_M,
    temperature: 120, // Generic temperature
    albedo: THEBE_ALBEDO,
    siderealRotationPeriod_s: THEBE_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: THEBE_SMA_M,
      eccentricity: THEBE_ECC,
      inclination: THEBE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: THEBE_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["rocky materials", "ice"],
      surface: {
        type: SurfaceType.CRATERED,
        color: "#888888",
        roughness: 0.8,
        classType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.0,
        simplePeriod: 2.0,
        octaves: 6,
        bumpScale: 0.5,
        color1: "#A9A9A9",
        color2: "#696969",
        color3: "#808080",
        color4: "#BEBEBE",
        color5: "#D3D3D3",
        height1: 0.2,
        height2: 0.4,
        height3: 0.6,
        height4: 0.8,
        height5: 1.0,
        shininess: 5,
        specularStrength: 0.1,
        ambientLightIntensity: 0.01,
        undulation: 0.1,
        terrainType: 1,
        terrainAmplitude: 0.2,
        terrainSharpness: 1.5,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });
}
