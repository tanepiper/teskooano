import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  PhysicsStateReal,
  type PlanetProperties,
} from "@teskooano/data-types";

// Verified Wikipedia data for Callisto - most heavily cratered moon in Solar System
const CALLISTO_MASS_KG = 1.075938e23; // Wikipedia verified: (1.075938±0.000137)×10²³ kg
const CALLISTO_RADIUS_M = 2410.3 * KM; // Wikipedia verified: 2410.3±1.5 km (mean radius)
const CALLISTO_SMA_M = 1882700 * KM; // Wikipedia verified: 1,882,700 km semi-major axis
const CALLISTO_ECC = 0.0074; // Wikipedia verified
const CALLISTO_INC_DEG = 0.192; // Wikipedia verified: 0.192° to local Laplace plane
const CALLISTO_LAN_DEG = 298.848; // Current value
const CALLISTO_AOP_DEG = 52.643; // Current value
const CALLISTO_MA_DEG = 181.408; // Current value
const CALLISTO_SIDEREAL_PERIOD_S = 16.6890184 * 24 * 3600; // Wikipedia: 16.6890184 days (synchronous)
const CALLISTO_ALBEDO = 0.22; // Wikipedia verified: 0.22 geometric albedo
const CALLISTO_TEMP_K = 134; // Wikipedia verified: mean 134±11 K

/**
 * Initializes Callisto, Jupiter's heavily cratered outermost moon.
 */
export function initializeCallisto(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "callisto",
    name: "Callisto",
    seed: "callisto_seed_16689",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: CALLISTO_MASS_KG,
    realRadius_m: CALLISTO_RADIUS_M,
    temperature: CALLISTO_TEMP_K,
    albedo: CALLISTO_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: CALLISTO_SMA_M,
      eccentricity: CALLISTO_ECC,
      inclination: CALLISTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: CALLISTO_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: CALLISTO_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: CALLISTO_MA_DEG * DEG_TO_RAD,
      period_s: CALLISTO_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: CALLISTO_SIDEREAL_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
    },
    physicsStateReal: {
      id: "callisto",
      mass_kg: CALLISTO_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: parentId,
      composition: [
        "water ice",
        "rocky material",
        "subsurface ocean",
        "undifferentiated interior",
        "carbonaceous material",
      ],
      atmosphere: {
        glowColor: "#E0E0E0",
        intensity: 0.02,
        power: 0.5,
        thickness: 0.01,
      },
      surface: {
        type: SurfaceType.ICE_CRACKED,
        color: "#707080",
        roughness: 0.8,
        classType: PlanetType.BARREN,
        persistence: 0.6,
        lacunarity: 2.4,
        simplePeriod: 3.0,
        octaves: 11,
        bumpScale: 3.2,
        color1: "#404050",
        color2: "#505060",
        color3: "#606070",
        color4: "#707080",
        color5: "#808090",
        height1: 0.05,
        height2: 0.2,
        height3: 0.4,
        height4: 0.65,
        height5: 0.85,
        shininess: 8,
        specularStrength: 0.1,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.35,
        terrainType: 2,
        terrainAmplitude: 1.1,
        terrainSharpness: 2.0,
        terrainOffset: -0.15,
      },
    } as PlanetProperties,
  });
}
