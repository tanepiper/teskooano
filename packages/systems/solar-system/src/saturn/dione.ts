import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { celestialManager } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const DIONE_MASS_KG = 1.095e21;
const DIONE_RADIUS_M = 561.4 * KM;
const DIONE_SMA_M = 377396 * KM;
const DIONE_ECC = 0.0022;
const DIONE_INC_DEG = 0.019;
const DIONE_LAN_DEG = 128.2;
const DIONE_AOP_DEG = 91.1;
const DIONE_MA_DEG = 357.6;
const DIONE_SIDEREAL_PERIOD_S = 236518;
const DIONE_ALBEDO = 0.998;

/**
 * Initializes Dione, one of Saturn's ice moons with wispy terrain features.
 */
export function initializeDione(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  celestialManager.addCelestial({
    id: "dione",
    name: "Dione",
    seed: "dione",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: DIONE_MASS_KG,
    realRadius_m: DIONE_RADIUS_M,
    temperature: 87,
    albedo: DIONE_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: DIONE_SMA_M,
      eccentricity: DIONE_ECC,
      inclination: DIONE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: DIONE_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: DIONE_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: DIONE_MA_DEG * DEG_TO_RAD,
      period_s: DIONE_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: DIONE_SIDEREAL_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
    },

    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      composition: ["water ice", "rocky core"],
      atmosphere: undefined,
      surface: {
        type: SurfaceType.ICE_CRACKED,
        color: "#E0E0E0",
        roughness: 0.5,
        classType: PlanetType.BARREN,
        persistence: 0.55,
        lacunarity: 2.0,
        simplePeriod: 2.2,
        octaves: 8,
        bumpScale: 2.4,
        color1: "#B0B0B0",
        color2: "#D0D0D0",
        color3: "#E0E0E0",
        color4: "#F0F0F0",
        color5: "#FFFFFF",
        height1: 0.12,
        height2: 0.28,
        height3: 0.5,
        height4: 0.72,
        height5: 0.88,
        shininess: 28,
        specularStrength: 0.6,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.18,
        terrainType: 3,
        terrainAmplitude: 0.65,
        terrainSharpness: 1.2,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });
}
