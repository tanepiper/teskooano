import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const GANYMEDE_MASS_KG = 1.4819e23;
const GANYMEDE_RADIUS_M = 2631200;
const GANYMEDE_SMA_M = 1070412 * KM;
const GANYMEDE_ECC = 0.0013;
const GANYMEDE_INC_DEG = 0.204;
const GANYMEDE_LAN_DEG = 63.552;
const GANYMEDE_AOP_DEG = 192.417;
const GANYMEDE_MA_DEG = 317.54;
const GANYMEDE_SIDEREAL_PERIOD_S = 618153;
const GANYMEDE_ALBEDO = 0.43;

/**
 * Initializes Ganymede, the largest moon in the Solar System.
 */
export function initializeGanymede(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "ganymede",
    name: "Ganymede",
    seed: "ganymede_seed_7155",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: GANYMEDE_MASS_KG,
    realRadius_m: GANYMEDE_RADIUS_M,
    temperature: 110,
    albedo: GANYMEDE_ALBEDO,
    siderealRotationPeriod_s: GANYMEDE_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: GANYMEDE_SMA_M,
      eccentricity: GANYMEDE_ECC,
      inclination: GANYMEDE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: GANYMEDE_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: GANYMEDE_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: GANYMEDE_MA_DEG * DEG_TO_RAD,
      period_s: GANYMEDE_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: parentId,
      composition: [
        "water ice",
        "silicates",
        "iron core",
        "possible subsurface ocean",
      ],
      atmosphere: {
        glowColor: "#FFFFFF",
        intensity: 0.01,
        power: 0.4,
        thickness: 0.005,
      },
      surface: {
        type: SurfaceType.ICE_FLATS,
        color: "#D0D8E0",
        roughness: 0.4,
        planetType: PlanetType.BARREN,
        persistence: 0.5,
        lacunarity: 2.0,
        simplePeriod: 2.5,
        octaves: 9,
        bumpScale: 2.7,
        color1: "#A0A8B0",
        color2: "#C0C8D0",
        color3: "#D0D8E0",
        color4: "#E0E8F0",
        color5: "#F0F8FF",
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.9,
        shininess: 20,
        specularStrength: 0.5,
        ambientLightIntensity: 0.38,
        undulation: 0.2,
        terrainType: 2,
        terrainAmplitude: 0.75,
        terrainSharpness: 1.2,
        terrainOffset: 0.05,
      },
    } as PlanetProperties,
  });
}
