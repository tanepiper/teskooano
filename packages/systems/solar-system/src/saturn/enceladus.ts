import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const ENCELADUS_MASS_KG = 1.08e20;
const ENCELADUS_RADIUS_KM = 252.1;
const ENCELADUS_SMA_KM = 238020;
const ENCELADUS_ECC = 0.0047;
const ENCELADUS_INC_DEG = 0.019;
const ENCELADUS_LAN_DEG = 169.8;
const ENCELADUS_AOP_DEG = 312.9;
const ENCELADUS_MA_DEG = 258.0;
const ENCELADUS_SIDEREAL_PERIOD_S = 118378;
const ENCELADUS_ALBEDO = 1.375;

/**
 * Enceladus configuration object for modular solar system initialization.
 */
export const enceladus: CelestialObject<PlanetProperties> = {
  id: "enceladus",
  name: "Enceladus",
  seed: "enceladus",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: ENCELADUS_MASS_KG,
  realRadius_m: kmToM(ENCELADUS_RADIUS_KM),
  temperature: 75,
  albedo: ENCELADUS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: ENCELADUS_SMA_KM / 149597870.7, // Convert km to AU
    eccentricity: ENCELADUS_ECC,
    inclinationDeg: ENCELADUS_INC_DEG,
    longitudeOfAscendingNodeDeg: ENCELADUS_LAN_DEG,
    argumentOfPeriapsisDeg: ENCELADUS_AOP_DEG,
    meanAnomalyDeg: ENCELADUS_MA_DEG,
    period_s: ENCELADUS_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: ENCELADUS_SIDEREAL_PERIOD_S,
    axialTiltDeg: 0,
  }),
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
      roughness: 0.3,
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
  },
};
