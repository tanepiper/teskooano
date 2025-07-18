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

const IAPETUS_MASS_KG = 1.806e21;
const IAPETUS_RADIUS_M = 734.5 * KM;
const IAPETUS_SMA_M = 3560820 * KM;
const IAPETUS_ECC = 0.0283;
const IAPETUS_INC_DEG = 15.47;
const IAPETUS_LAN_DEG = 81.1;
const IAPETUS_AOP_DEG = 271.6;
const IAPETUS_MA_DEG = 23.9;
const IAPETUS_SIDEREAL_PERIOD_S = 6855300;
const IAPETUS_ALBEDO = 0.04;

/**
 * Initializes Iapetus, Saturn's two-toned moon with distinct dark and light hemispheres.
 */
export function initializeIapetus(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  celestial.addCelestial({
    id: "iapetus",
    name: "Iapetus",
    seed: "iapetus",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: IAPETUS_MASS_KG,
    realRadius_m: IAPETUS_RADIUS_M,
    temperature: 110,
    albedo: IAPETUS_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: IAPETUS_SMA_M,
      eccentricity: IAPETUS_ECC,
      inclination: IAPETUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: IAPETUS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: IAPETUS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: IAPETUS_MA_DEG * DEG_TO_RAD,
      period_s: IAPETUS_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: IAPETUS_SIDEREAL_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      composition: ["water ice", "rock", "carbonaceous material on one side"],
      atmosphere: undefined,
      surface: {
        type: SurfaceType.VARIED,
        color: "#A0A0A0",
        roughness: 0.7,
        classType: PlanetType.BARREN,
        persistence: 0.48,
        lacunarity: 2.3,
        simplePeriod: 1.8,
        octaves: 10,
        bumpScale: 2.5,
        color1: "#201008",
        color2: "#404040",
        color3: "#808080",
        color4: "#C0C0C0",
        color5: "#F0F0F0",
        height1: 0.15,
        height2: 0.35,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 16,
        specularStrength: 0.4,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.25,
        terrainType: 2,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.4,
        terrainOffset: -0.05,
      },
    } as PlanetProperties,
  });
}
