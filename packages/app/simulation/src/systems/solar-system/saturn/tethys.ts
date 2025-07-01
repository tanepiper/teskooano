import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const TETHYS_MASS_KG = 6.174e20;
const TETHYS_RADIUS_M = 531100;
const TETHYS_SMA_M = 294619 * KM;
const TETHYS_ECC = 0.0001;
const TETHYS_INC_DEG = 1.12;
const TETHYS_LAN_DEG = 118.5;
const TETHYS_AOP_DEG = 262.9;
const TETHYS_MA_DEG = 156.3;
const TETHYS_SIDEREAL_PERIOD_S = 163475;
const TETHYS_ALBEDO = 1.229;

/**
 * Initializes Tethys, Saturn's ice moon with a massive crater (Odysseus).
 */
export function initializeTethys(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "tethys",
    name: "Tethys",
    seed: "tethys",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: TETHYS_MASS_KG,
    realRadius_m: TETHYS_RADIUS_M,
    temperature: 86,
    albedo: TETHYS_ALBEDO,
    siderealRotationPeriod_s: TETHYS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: TETHYS_SMA_M,
      eccentricity: TETHYS_ECC,
      inclination: TETHYS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: TETHYS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: TETHYS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: TETHYS_MA_DEG * DEG_TO_RAD,
      period_s: TETHYS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["mostly water ice", "small amount of rock"],
      atmosphere: {
        glowColor: "#FFFF00",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.ICE_CRACKED,
        color: "#F8F8F8",
        roughness: 0.4,
        planetType: PlanetType.BARREN,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 1.9,
        octaves: 9,
        bumpScale: 2.6,
        color1: "#C8C8C8",
        color2: "#E0E0E0",
        color3: "#F0F0F0",
        color4: "#F8F8F8",
        color5: "#FFFFFF",
        height1: 0.08,
        height2: 0.22,
        height3: 0.45,
        height4: 0.7,
        height5: 0.9,
        shininess: 36,
        specularStrength: 0.8,
        ambientLightIntensity: 0.45,
        undulation: 0.15,
        terrainType: 3,
        terrainAmplitude: 0.7,
        terrainSharpness: 1.6,
        terrainOffset: 0.15,
      },
    } as PlanetProperties,
  });
}
