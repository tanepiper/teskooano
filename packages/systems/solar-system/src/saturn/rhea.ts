import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { celestial } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const RHEA_MASS_KG = 2.306e21;
const RHEA_RADIUS_M = 763.8 * KM;
const RHEA_SMA_M = 527108 * KM;
const RHEA_ECC = 0.001;
const RHEA_INC_DEG = 0.345;
const RHEA_LAN_DEG = 130.7;
const RHEA_AOP_DEG = 349.3;
const RHEA_MA_DEG = 127.5;
const RHEA_SIDEREAL_PERIOD_S = 390262;
const RHEA_ALBEDO = 0.949;

/**
 * Initializes Rhea, Saturn's second-largest moon.
 */
export function initializeRhea(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  celestial.addCelestial({
    id: "rhea",
    name: "Rhea",
    seed: "rhea",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: RHEA_MASS_KG,
    realRadius_m: RHEA_RADIUS_M,
    temperature: 73,
    albedo: RHEA_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: RHEA_SMA_M,
      eccentricity: RHEA_ECC,
      inclination: RHEA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: RHEA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: RHEA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: RHEA_MA_DEG * DEG_TO_RAD,
      period_s: RHEA_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: RHEA_SIDEREAL_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      composition: ["water ice", "rocky core"],
      atmosphere: {
        glowColor: "#FFFFFF",
        intensity: 0.01,
        power: 0.5,
        thickness: 0.005,
      },
      surface: {
        type: SurfaceType.ICE_FLATS,
        color: "#EAEAEA",
        roughness: 0.7,
        classType: PlanetType.BARREN,
        persistence: 0.52,
        lacunarity: 2.2,
        simplePeriod: 2.5,
        octaves: 9,
        bumpScale: 2.8,
        color1: "#EAEAEA",
        color2: "#D3D3D3",
        color3: "#C0C0C0",
        color4: "#F0F0F0",
        color5: "#FFFFFF",
        height1: 0.1,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 0.95,
        shininess: 32,
        specularStrength: 0.6,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.2,
        terrainType: 2,
        terrainAmplitude: 0.6,
        terrainSharpness: 1.5,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
