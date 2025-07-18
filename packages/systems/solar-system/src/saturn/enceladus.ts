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

const ENCELADUS_MASS_KG = 1.08e20;
const ENCELADUS_RADIUS_M = 252.1 * KM;
const ENCELADUS_SMA_M = 238020 * KM;
const ENCELADUS_ECC = 0.0047;
const ENCELADUS_INC_DEG = 0.019;
const ENCELADUS_LAN_DEG = 169.8;
const ENCELADUS_AOP_DEG = 312.9;
const ENCELADUS_MA_DEG = 258.0;
const ENCELADUS_SIDEREAL_PERIOD_S = 118378;
const ENCELADUS_ALBEDO = 1.375;

/**
 * Initializes Enceladus, Saturn's geologically active ice moon with water geysers.
 */
export function initializeEnceladus(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  celestial.addCelestial({
    id: "enceladus",
    name: "Enceladus",
    seed: "enceladus",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: ENCELADUS_MASS_KG,
    realRadius_m: ENCELADUS_RADIUS_M,
    temperature: 75,
    albedo: ENCELADUS_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: ENCELADUS_SMA_M,
      eccentricity: ENCELADUS_ECC,
      inclination: ENCELADUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: ENCELADUS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: ENCELADUS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: ENCELADUS_MA_DEG * DEG_TO_RAD,
      period_s: ENCELADUS_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: ENCELADUS_SIDEREAL_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      composition: [
        "water ice",
        "silicate core",
        "subsurface ocean",
        "water vapor geysers",
      ],
      atmosphere: {
        glowColor: "#FFFFFF",
        intensity: 0.05,
        power: 0.8,
        thickness: 0.02,
      },
      surface: {
        type: SurfaceType.ICE_CRACKED,
        color: "#F8F8FF",
        roughness: 0.3,
        classType: PlanetType.BARREN,
        persistence: 0.45,
        lacunarity: 1.8,
        simplePeriod: 1.2,
        octaves: 7,
        bumpScale: 1.8,
        color1: "#E0E8F0",
        color2: "#F0F0F8",
        color3: "#F8F8FF",
        color4: "#FFFFFF",
        color5: "#FFFFF0",
        height1: 0.15,
        height2: 0.3,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 40,
        specularStrength: 0.9,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.12,
        terrainType: 3,
        terrainAmplitude: 0.4,
        terrainSharpness: 1.1,
        terrainOffset: 0.2,
      },
    } as PlanetProperties,
  });
}
