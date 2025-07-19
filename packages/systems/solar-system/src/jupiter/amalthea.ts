import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const AMALTHEA_MASS_KG = 2.08e18;
const AMALTHEA_RADIUS_M = 83500;
const AMALTHEA_SMA_M = 181400 * KM;
const AMALTHEA_ECC = 0.00319;
const AMALTHEA_INC_DEG = 0.374;
const AMALTHEA_SIDEREAL_PERIOD_S = 43042;
const AMALTHEA_ALBEDO = 0.09;

/**
 * Amalthea moon configuration object for modular solar system initialization.
 */
export const amalthea: CelestialObject<PlanetProperties> = {
  id: "amalthea",
  name: "Amalthea",
  seed: "amalthea_seed_2024",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: AMALTHEA_MASS_KG,
  realRadius_m: AMALTHEA_RADIUS_M,
  temperature: 120, // Generic temperature
  albedo: AMALTHEA_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: AMALTHEA_SMA_M,
    eccentricity: AMALTHEA_ECC,
    inclination: AMALTHEA_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: AMALTHEA_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: AMALTHEA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["rocky materials", "ice"],
    surface: {
      roughness: 0.8,
      persistence: 0.5,
      lacunarity: 2.0,
      simplePeriod: 2.0,
      octaves: 6,
      bumpScale: 0.5,
      color1: "#A9A9A9",
      color2: "#696969",
      color3: "#808080",
      color4: "#BEBEBE",
      color5: "#D3D3D3",
      height1: 0.2,
      height2: 0.4,
      height3: 0.6,
      height4: 0.8,
      height5: 1.0,
      shininess: 5,
      specularStrength: 0.1,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.1,
      terrainType: 1,
      terrainAmplitude: 0.2,
      terrainSharpness: 1.5,
      terrainOffset: 0.1,
    },
  },
};
