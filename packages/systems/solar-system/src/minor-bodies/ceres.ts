import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const CERES_MASS_KG = 9.393e20;
const CERES_RADIUS_KM = 473;
const CERES_TEMP_K = 167;
const CERES_ALBEDO = 0.09;
const CERES_SMA_AU = 2.766;
const CERES_ECC = 0.0758;
const CERES_INC_DEG = 10.593;
const CERES_LAN_DEG = 80.329;
const CERES_AOP_DEG = 72.522;
const CERES_MA_DEG = 95.989;
const CERES_ORBITAL_PERIOD_S = 1.4425e8;
const CERES_SIDEREAL_ROTATION_PERIOD_S = 32668.8;
const CERES_AXIAL_TILT_DEG = 4.0;

/**
 * Ceres dwarf planet configuration object for modular solar system initialization.
 */
export const ceres: CelestialObject<PlanetProperties> = {
  id: "ceres",
  name: "Ceres",
  seed: "ceres",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: CERES_MASS_KG,
  realRadius_m: kmToM(CERES_RADIUS_KM),
  temperature: CERES_TEMP_K,
  albedo: CERES_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: CERES_SMA_AU,
    eccentricity: CERES_ECC,
    inclinationDeg: CERES_INC_DEG,
    longitudeOfAscendingNodeDeg: CERES_LAN_DEG,
    argumentOfPeriapsisDeg: CERES_AOP_DEG,
    meanAnomalyDeg: CERES_MA_DEG,
    period_s: CERES_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: CERES_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: CERES_AXIAL_TILT_DEG,
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: [
      "water ice",
      "hydrated minerals",
      "carbonates",
      "clay minerals",
      "salts",
    ],
    atmosphere: undefined,
    surface: {
      roughness: 0.8,
      persistence: 0.52,
      lacunarity: 2.1,
      simplePeriod: 2.8,
      octaves: 9,
      bumpScale: 2.5,
      color1: "#6D5D4D",
      color2: "#8C7853",
      color3: "#A69080",
      color4: "#C0B0A0",
      color5: "#D4C4B4",
      height1: 0.08,
      height2: 0.25,
      height3: 0.45,
      height4: 0.7,
      height5: 0.9,
      shininess: 4,
      specularStrength: 0.15,
      ambientLightIntensity: 0.01,
      undulation: 0.3,
      terrainType: 2,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.4,
      terrainOffset: -0.1,
    },
  },
};
