import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const TITAN_MASS_KG = 1.3452e23;
const TITAN_RADIUS_M = 2574700;
const TITAN_SMA_M = 1221870 * KM;
const TITAN_ECC = 0.0288;
const TITAN_INC_DEG = 0.3485;
const TITAN_LAN_DEG = 28.06;
const TITAN_AOP_DEG = 180.4;
const TITAN_MA_DEG = 49.8;
const TITAN_SIDEREAL_PERIOD_S = 1377700;
const TITAN_ALBEDO = 0.22;

/**
 * Initializes Titan, Saturn's largest moon with a thick atmosphere and methane lakes.
 */
export function initializeTitan(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "titan",
    name: "Titan",
    seed: "titan",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: TITAN_MASS_KG,
    realRadius_m: TITAN_RADIUS_M,
    temperature: 94,
    albedo: TITAN_ALBEDO,
    siderealRotationPeriod_s: TITAN_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: TITAN_SMA_M,
      eccentricity: TITAN_ECC,
      inclination: TITAN_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: TITAN_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: TITAN_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: TITAN_MA_DEG * DEG_TO_RAD,
      period_s: TITAN_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: [
        "nitrogen atmosphere",
        "methane clouds",
        "water ice mantle",
        "rocky core",
        "liquid methane/ethane lakes",
      ],
      atmosphere: {
        glowColor: "#FFA500",
        intensity: 0.7,
        power: 1.3,
        thickness: 0.35,
      },
      surface: {
        type: SurfaceType.FLAT,
        color: "#A06A42",
        roughness: 0.2,
        planetType: PlanetType.ROCKY,
        persistence: 0.53,
        lacunarity: 2.14,
        simplePeriod: 0.87,
        octaves: 8,
        bumpScale: 10,
        color1: "#A06A42",
        color2: "#8B4513",
        color3: "#2F4F4F",
        color4: "#F5DEB3",
        color5: "#FFFAFA",
        height1: 0.088,
        height2: 0.42,
        height3: 0.41,
        height4: 0.44,
        height5: 0.44,
        shininess: 23,
        specularStrength: 0.47,
        ambientLightIntensity: 0.42,
        undulation: 0.1,
        terrainType: 3,
        terrainAmplitude: 0.2,
        terrainSharpness: 1.3,
        terrainOffset: 0.25,
      },
    } as PlanetProperties,
  });
}