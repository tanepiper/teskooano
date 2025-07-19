import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

const THALASSA_MASS_KG = 4e17; // Estimate similar to Naiad
const THALASSA_RADIUS_M = 40000; // 40 km
const THALASSA_SMA_KM = 50074;
const THALASSA_ECC = 0.0002;
const THALASSA_INC_DEG = 0.21;
const THALASSA_SIDEREAL_PERIOD_S = 7.5 * 3600;
const THALASSA_ALBEDO = 0.07;

/**
 * Thalassa configuration object for modular solar system initialization.
 */
export const thalassa: CelestialObject<PlanetProperties> = {
  id: "thalassa",
  name: "Thalassa",
  seed: "thalassa",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "neptune", // Will be replaced during initialization
  realMass_kg: THALASSA_MASS_KG,
  realRadius_m: THALASSA_RADIUS_M,
  temperature: 60,
  albedo: THALASSA_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: THALASSA_SMA_KM / 149597870.7, // Convert km to AU
    eccentricity: THALASSA_ECC,
    inclinationDeg: THALASSA_INC_DEG,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: THALASSA_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: THALASSA_SIDEREAL_PERIOD_S,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["water ice", "rock"],
    surface: {
      roughness: 0.8,
      persistence: 0.5,
      lacunarity: 2.1,
      simplePeriod: 3.0,
      octaves: 6,
      bumpScale: 0.6,
      color1: "#666666",
      color2: "#7A7A7A",
      color3: "#888888",
      color4: "#A0A0A0",
      color5: "#B8B8B8",
      height1: 0.05,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 0.9,
      shininess: 4,
      specularStrength: 0.05,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.2,
      terrainType: 1,
      terrainAmplitude: 0.3,
      terrainSharpness: 1.4,
      terrainOffset: 0.0,
    },
  },
};
