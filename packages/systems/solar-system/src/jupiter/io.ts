import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

// Verified Wikipedia data for Io
const IO_MASS_KG = 8.9319e22; // Wikipedia verified
const IO_RADIUS_M = 1821.6 * KM; // Mean radius from Wikipedia: 1821.6±0.5 km
const IO_SMA_M = 421800 * KM; // Wikipedia verified: 421,800 km
const IO_ECC = 0.0041; // Wikipedia verified
const IO_INC_DEG = 0.05; // Wikipedia verified: 0.050° to Jupiter's equator
const IO_LAN_DEG = 43.977; // Current value
const IO_AOP_DEG = 84.129; // Current value
const IO_MA_DEG = 342.021; // Current value
const IO_SIDEREAL_PERIOD_S = 1.769137786 * 24 * 3600; // Wikipedia: 1.769137786 days (synchronous)
const IO_ALBEDO = 0.63; // Wikipedia verified
const IO_TEMP_K = 110; // Wikipedia verified: mean 110 K

/**
 * Io moon configuration object for modular solar system initialization.
 */
export const io: CelestialObject<PlanetProperties> = {
  id: "io",
  name: "Io",
  seed: "io_seed_1769",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: IO_MASS_KG,
  realRadius_m: IO_RADIUS_M,
  temperature: IO_TEMP_K,
  albedo: IO_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: IO_SMA_M,
    eccentricity: IO_ECC,
    inclination: IO_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: IO_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: IO_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: IO_MA_DEG * DEG_TO_RAD,
    period_s: IO_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: IO_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: [
      "sulfur compounds",
      "silicates",
      "iron core",
      "molten interior",
    ],
    atmosphere: {
      glowColor: "#FFFF00",
      intensity: 0.1,
      power: 0.8,
      thickness: 0.05,
    },
    surface: {
      roughness: 0.6,
      persistence: 0.58,
      lacunarity: 1.9,
      simplePeriod: 1.7,
      octaves: 8,
      bumpScale: 2.5,
      color1: "#FFFFA0",
      color2: "#FF6347",
      color3: "#FF2000",
      color4: "#8B4513",
      color5: "#201000",
      height1: 0.15,
      height2: 0.35,
      height3: 0.55,
      height4: 0.75,
      height5: 0.9,
      shininess: 18,
      specularStrength: 0.3,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.4,
      terrainType: 2,
      terrainAmplitude: 1.2,
      terrainSharpness: 1.8,
      terrainOffset: 0.2,
    },
  },
};
