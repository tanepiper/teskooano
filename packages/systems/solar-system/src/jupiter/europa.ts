import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { celestial } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

// Verified Wikipedia/NASA data for Europa
const EUROPA_MASS_KG = 4.799844e22; // Wikipedia verified: (4.799844±0.000013)×10²² kg
const EUROPA_RADIUS_M = 1560.8 * KM; // Wikipedia verified: 1560.8±0.5 km
const EUROPA_SMA_M = 670900 * KM; // Wikipedia verified: 670,900 km mean orbit radius
const EUROPA_ECC = 0.009; // Wikipedia verified
const EUROPA_INC_DEG = 0.47; // Wikipedia verified: 0.470° to Jupiter's equator
const EUROPA_LAN_DEG = 219.106; // Current value
const EUROPA_AOP_DEG = 88.97; // Current value
const EUROPA_MA_DEG = 171.016; // Current value
const EUROPA_SIDEREAL_PERIOD_S = 3.551181 * 24 * 3600; // Wikipedia: 3.551181 days (synchronous)
const EUROPA_ALBEDO = 0.67; // Wikipedia verified: 0.67 ± 0.03
const EUROPA_TEMP_K = 102; // Wikipedia verified: mean 102 K

/**
 * Initializes Europa, Jupiter's icy moon with a subsurface ocean.
 */
export function initializeEuropa(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  celestial.addCelestial({
    id: "europa",
    name: "Europa",
    seed: "europa_seed_3551",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: EUROPA_MASS_KG,
    realRadius_m: EUROPA_RADIUS_M,
    temperature: EUROPA_TEMP_K,
    albedo: EUROPA_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: EUROPA_SMA_M,
      eccentricity: EUROPA_ECC,
      inclination: EUROPA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: EUROPA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: EUROPA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: EUROPA_MA_DEG * DEG_TO_RAD,
      period_s: EUROPA_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: EUROPA_SIDEREAL_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
    },

    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      composition: [
        "water ice shell",
        "silicate mantle",
        "iron core",
        "subsurface ocean",
      ],
      atmosphere: {
        glowColor: "#FFFFFF",
        intensity: 0.02,
        power: 0.5,
        thickness: 0.01,
      },
      surface: {
        type: SurfaceType.ICE_CRACKED,
        color: "#F0F4F8",
        roughness: 0.3,
        classType: PlanetType.BARREN,
        persistence: 0.53,
        lacunarity: 2.15,
        simplePeriod: 0.86,
        octaves: 8,
        bumpScale: 10,
        color1: "#E8F4F8",
        color2: "#F0F4F8",
        color3: "#F8F8F8",
        color4: "#FFFFFF",
        color5: "#F0FFFF",
        height1: 0.088,
        height2: 0.41,
        height3: 0.4,
        height4: 0.43,
        height5: 0.43,
        shininess: 24,
        specularStrength: 0.7,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.1,
        terrainType: 3,
        terrainAmplitude: 0.19,
        terrainSharpness: 1.3,
        terrainOffset: 0.25,
      },
    } as PlanetProperties,
  });
}
