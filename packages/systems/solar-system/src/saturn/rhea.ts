import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const RHEA_MASS_KG = 2.306e21;
const RHEA_RADIUS_KM = 763.8;
const RHEA_ECC = 0.001;
const RHEA_INC_DEG = 0.345;
const RHEA_LAN_DEG = 130.7;
const RHEA_AOP_DEG = 349.3;
const RHEA_MA_DEG = 127.5;
const RHEA_SIDEREAL_PERIOD_S = 390262;
const RHEA_ALBEDO = 0.949;

/**
 * Rhea configuration object for modular solar system initialization.
 */
export const rhea: CelestialObject<PlanetProperties> = {
  id: "rhea",
  name: "Rhea",
  seed: "rhea",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: RHEA_MASS_KG,
  realRadius_m: kmToM(RHEA_RADIUS_KM),
  temperature: 73,
  albedo: RHEA_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.003289,
    eccentricity: RHEA_ECC,
    inclinationDeg: RHEA_INC_DEG,
    longitudeOfAscendingNodeDeg: RHEA_LAN_DEG,
    argumentOfPeriapsisDeg: RHEA_AOP_DEG,
    meanAnomalyDeg: RHEA_MA_DEG,
    period_s: RHEA_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: RHEA_SIDEREAL_PERIOD_S,
    axialTiltDeg: 0,
  }),
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
      roughness: 0.7,
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
      shininess: 45,
      specularStrength: 0.25,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.2,
      terrainType: 2,
      terrainAmplitude: 0.6,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  },
};
