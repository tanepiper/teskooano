import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

const DESPINA_MASS_KG = 2.1e18;
const DESPINA_RADIUS_M = 78000; // 78 km
const DESPINA_SMA_M = 52527 * KM;
const DESPINA_ECC = 0.0001;
const DESPINA_INC_DEG = 0.07;
const DESPINA_SIDEREAL_PERIOD_S = 8.0 * 3600;
const DESPINA_ALBEDO = 0.09;

/**
 * Despina configuration object for modular solar system initialization.
 */
export const despina: CelestialObject<PlanetProperties> = {
  id: "despina",
  name: "Despina",
  seed: "despina",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "neptune", // Will be replaced during initialization
  realMass_kg: DESPINA_MASS_KG,
  realRadius_m: DESPINA_RADIUS_M,
  temperature: 60,
  albedo: DESPINA_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: DESPINA_SMA_M,
    eccentricity: DESPINA_ECC,
    inclination: DESPINA_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: DESPINA_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: DESPINA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["water ice", "rock"],
    surface: {
      roughness: 0.85,
      persistence: 0.5,
      lacunarity: 2.1,
      simplePeriod: 3.0,
      octaves: 6,
      bumpScale: 0.6,
      color1: "#707070",
      color2: "#808080",
      color3: "#909090",
      color4: "#A8A8A8",
      color5: "#C0C0C0",
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
